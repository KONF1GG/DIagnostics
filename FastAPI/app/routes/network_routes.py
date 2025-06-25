"""
Маршруты для работы с сетью.
"""

import logging
from datetime import datetime
from typing import Dict, Optional, Any
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from app.utils.funcs import compare_json, is_active, safe_json_parse
from app.crud import get_login_data
from app.depencies import TokenDependency, RedisDependency, SessionRediusDependency

# Настройка логирования
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get('/v1/network', response_model=Dict[str, Any], tags=["Сеть"])
async def get_connection_data(
        redis: RedisDependency,
        redius: SessionRediusDependency,  # type: ignore
        token: TokenDependency,
        login: Optional[str] = Query(None),
):
    """Эндпоинт для получения информации о подключении"""
    response_data = {
        "errors": [],
        "radius": None,
        "redis": None,
        "differences": None
    }

    try:
        if login:
            try:
                current_time = datetime.now()
            except Exception as e:
                logger.error("Ошибка получения текущего времени для login %s: %s", login, str(e))
                response_data['errors'].append(f"Ошибка получения текущего времени: {str(e)}")
                raise HTTPException(status_code=500, detail="Ошибка получения текущего времени") from e

            # Проверка данных из Radius
            radius_data_dict = None
            if redius:
                try:
                    result = await redius.execute(text(
                        'SELECT passwd, gmt, ip_addr, time_to, onu_mac, json_data '
                        'FROM freedom_users '
                        'WHERE login = :login AND billing = :billing'
                    ), {'login': login, 'billing': '1c'})
                    radius_data = result.fetchone()
                    if radius_data:
                        try:
                            keys = ['password', 'GMT', 'ip_addr', 'time_to', 'onu_mac', 'json_data']
                            radius_data_dict = dict(zip(keys, radius_data))

                            radius_data_dict = {
                                key: (
                                    await safe_json_parse(value) if key == 'json_data' else 
                                    None if value in ('', 'null', 'None') else 
                                    value
                                )
                                for key, value in radius_data_dict.items()
                            }
                        except Exception as e:
                            logger.error("Ошибка обработки данных из Радиуса для login %s: %s", login, str(e))
                            response_data['errors'].append(f"Ошибка обработки данных из Радиуса: {str(e)}")
                            radius_data_dict = None

                except Exception as e:
                    logger.error("Ошибка получения данных из Радиуса для login %s: %s", login, str(e))
                    response_data['errors'].append(f"Ошибка получения данных из Радиуса: {str(e)}")
                    radius_data_dict = None
            else:
                response_data['errors'].append("Радиус недоступен")

            # Проверка данных из Redis
            redis_data_dict = None
            if redis:
                try:
                    redis_data_dict = await get_login_data(login, redis)
                except Exception as e:
                    logger.error("Ошибка получения данных из Redis для login %s: %s", login, str(e))
                    response_data['errors'].append(f"Ошибка получения данных из Redis: {str(e)}")
                    redis_data_dict = None

            # Если данные доступны из обеих баз
            if redis_data_dict and radius_data_dict:
                try:
                    timeto_value = redis_data_dict.get('servicecats', {}).get('internet', {}).get('timeto', None)
                    # Преобразуем timeto из Redis в datetime для сравнения
                    if timeto_value is not None:
                        try:
                            timeto_value = datetime.fromtimestamp(timeto_value)
                            redis_data_dict['servicecats']['internet']['timeto'] = timeto_value
                        except (ValueError, TypeError, OSError) as e:
                            logger.error("Ошибка преобразования времени из Redis для login %s: %s", login, str(e))
                            response_data['errors'].append(f"Ошибка преобразования времени из Redis: {str(e)}")
                    
                    try:
                        differences = await compare_json(radius_data_dict, redis_data_dict)
                    except Exception as e:
                        logger.error("Ошибка сравнения данных для login %s: %s", login, str(e))
                        response_data['errors'].append(f"Ошибка сравнения данных: {str(e)}")
                        differences = None

                    # Логика для определения активности соединения
                    try:
                        radius_active = is_active(radius_data_dict, current_time)
                        redis_active = is_active(redis_data_dict, current_time)

                        radius_data_dict['active'] = radius_active
                        redis_data_dict['active'] = redis_active
                    except Exception as e:
                        logger.error("Ошибка определения активности для login %s: %s", login, str(e))
                        response_data['errors'].append(f"Ошибка определения активности: {str(e)}")
                        radius_data_dict['active'] = False
                        redis_data_dict['active'] = False

                    # Удаляем ненужные данные
                    try:
                        radius_data_dict.pop('password', None)
                        redis_data_dict.pop('password', None)
                    except Exception as e:
                        logger.error("Ошибка удаления пароля для login %s: %s", login, str(e))
                        response_data['errors'].append(f"Ошибка удаления пароля: {str(e)}")

                    # Собираем ответ
                    response_data['radius'] = radius_data_dict
                    response_data['redis'] = redis_data_dict
                    response_data['differences'] = differences

                except Exception as e:
                    logger.error("Ошибка обработки данных из обеих баз для login %s: %s", login, str(e))
                    response_data['errors'].append(f"Ошибка обработки данных из обеих баз: {str(e)}")

            # Если доступны только данные из Radius
            elif radius_data_dict and not redis_data_dict:
                try:
                    radius_active = is_active(radius_data_dict, current_time)
                    radius_data_dict['active'] = radius_active
                    radius_data_dict.pop('password', None)

                    json_data = await safe_json_parse(radius_data_dict.get('json_data'))
                    response_data['radius'] = json_data
                    response_data['errors'].append(f"Ошибка получения данных из Редиса по логину - {login}. Показаны только данные из Радиуса")
                except Exception as e:
                    logger.error("Ошибка обработки данных из Радиуса для login %s: %s", login, str(e))
                    response_data['errors'].append(f"Ошибка обработки данных из Радиуса: {str(e)}")

            # Если доступны только данные из Redis
            elif redis_data_dict and not radius_data_dict:
                try:
                    redis_active = is_active(redis_data_dict, current_time)
                    redis_data_dict['active'] = redis_active
                    redis_data_dict.pop('password', None)

                    response_data['redis'] = redis_data_dict
                    response_data['errors'].append(f"Ошибка получения данных из Радиуса по логину - {login}. Показаны только данные из Редиса")
                except Exception as e:
                    logger.error("Ошибка обработки данных из Redis для login %s: %s", login, str(e))
                    response_data['errors'].append(f"Ошибка обработки данных из Redis: {str(e)}")

            # Если данных нет ни откуда
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f'Данные по логину {login} не найдены',
                )

        else:
            response_data['errors'].append("Логин не указан")
            
        return response_data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Неожиданная ошибка в эндпоинте сети для login %s: %s", login, str(e))
        response_data['errors'].append(f"Неожиданная ошибка: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Внутренняя ошибка сервера"
        ) from e