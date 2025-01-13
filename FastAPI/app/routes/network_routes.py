from datetime import datetime
import json
from typing import Dict, Optional, Any
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from app.utils.funcs import compare_json, is_active, safe_json_parse
from app.crud import get_login_data
from app.depencies import TokenDependency, RedisDependency, SessionRediusDependency
from app.schemas import LoginConnData, RedisConnData, RediusConnData

router = APIRouter()


@router.get('/v1/network', response_model=Dict[str, Any])
async def get_connection_data(
        redis: RedisDependency,
        redius: SessionRediusDependency,
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

    if login:
        current_time = datetime.now()

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

            except Exception:
                response_data['errors'].append("Ошибка получения данных из Радиуса")
        else:
            response_data['errors'].append("Радиус недоступен")

        # Проверка данных из Redis
        redis_data_dict = None
        if redis:
            try:
                redis_data_dict = await get_login_data(login, redis)
            except Exception:
                redis_data_dict = None
        else:
            response_data['errors'].append("Редис недоступен")

        # Если данные доступны из обеих баз
        if redis_data_dict and radius_data_dict:
            timeto_value = redis_data_dict.get('servicecats', {}).get('internet', {}).get('timeto', None)
            # Преобразуем timeto из Redis в datetime для сравнения
            if timeto_value is not None:
                timeto_value = datetime.fromtimestamp(timeto_value)
                redis_data_dict['servicecats']['internet']['timeto'] = timeto_value
            differences = await compare_json(radius_data_dict, redis_data_dict)

            # Логика для определения активности соединения
            radius_active = is_active(radius_data_dict, current_time)
            redis_active = is_active(redis_data_dict, current_time)

            radius_data_dict['active'] = radius_active
            redis_data_dict['active'] = redis_active

            # Удаляем ненужные данные
            radius_data_dict.pop('password', None)
            redis_data_dict.pop('password', None)

            # Собираем ответ
            response_data['radius'] = radius_data_dict
            response_data['redis'] = redis_data_dict
            response_data['differences'] = differences

        # Если доступны только данные из Radius
        elif radius_data_dict and not redis_data_dict:
            radius_active = is_active(radius_data_dict, current_time)
            radius_data_dict['active'] = radius_active
            radius_data_dict.pop('password', None)

            json_data = await safe_json_parse(radius_data_dict.get('json_data'))
            response_data['radius'] = radius_data_dict
            response_data['errors'].append(f"Ошибка получения данных из Редиса по логину - {login}. Показаны только данные из Радиуса")

        # Если доступны только данные из Redis
        elif redis_data_dict and not radius_data_dict:
            redis_active = is_active(redis_data_dict, current_time)
            redis_data_dict['active'] = redis_active
            redis_data_dict.pop('password', None)

            response_data['redis'] = redis_data_dict
            response_data['errors'].append(f"Ошибка получения данных из Радиуса по логину - {login}. Показаны только данные из Редиса")

        # Если данных нет ни откуда
        else:
            raise HTTPException(
            status_code=404,
            detail=f'Данные по логину {login} dcxsssssssssssssssssssssssssне найдены',
        )

    else:
        response_data['errors'].append("Логин не указан")
        
    return response_data