"""
Маршруты для работы с услугами ТВ.
"""

import asyncio
import logging
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Optional
from app import config
from app.crud import (
    get_TV_services_from_1c,
    get_parental_code,
    get_smotreshka_data,
    get_tv24_data,
    get_tvip_data,
    )
from app.depencies import TokenDependency
from app.schemas import Service1C, Service1c

# Настройка логирования
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get('/v1/TV', response_model=Dict, tags=["ТВ"])
async def get_connection_data(
    token: TokenDependency,
    login: Optional[str] = Query(None)
):
    """Эндпоинт для получения информации по услугам ТВ"""
    try:
        if not login:
            raise HTTPException(status_code=400, detail="Логин не указан")

        try:
            response_data = initialize_response_data()
            try:
                services_from_1c = await get_TV_services_from_1c(login)
            except Exception as e:
                logger.error("Ошибка получения данных из 1С: %s", str(e))
                response_data["errors"]["_1c"] = f"Не удалось получить данные из 1С: {str(e)}"
                return response_data

            if not services_from_1c:
                response_data["errors"]["_1c"] = "Не удалось получить данные из 1С"
                return response_data

            operators = set()
            tasks = []

            for service in services_from_1c:
                try:
                    if service.operator not in operators or service.operator == '24ТВ' or service.operator == '24ТВ КРД':
                        await update_service_data(response_data, service)
                        if service.password != 'Второй номер':
                            tasks.append(prepare_operator_task(service))
                        operators.add(service.operator)
                    else:
                        append_service_data(response_data, service)
                except Exception as e:
                    logger.error("Ошибка обработки сервиса %s: %s", getattr(service, 'operator', 'unknown'), str(e))
                    response_data["errors"][getattr(service, 'operator', 'unknown')] = str(e)

            try:
                results = await asyncio.gather(*tasks, return_exceptions=True)
            except Exception as e:
                logger.error("Ошибка при выполнении задач операторов: %s", str(e))
                response_data["errors"]["gather"] = str(e)
                results = []

            await process_results(response_data, results, services_from_1c)
            return response_data
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Внутренняя ошибка в обработке ТВ: %s", str(e))
            raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера") from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Внутренняя ошибка эндпоинта ТВ: %s", str(e))
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера") from e


def initialize_response_data():
    """Инициализация структуры данных для ответа"""
    return {
        "smotreshka": {"login": None, "password": None, "not_turnoff_if_not_used": None, "service1c": [], "serviceOp": [], "ban_on_app": None, "error": None},
        "tvip": {"login": None, "password": None, "service1c": [], "serviceOp": [], "error": None},
        "tv24": {"phone": {}, "service1c": [], "serviceOp": [], "error": None, "additional_phones": [], "ban_on_app": False, "isKRD": None, "parental_code": None},
        "errors": {}
    }

async def update_service_data(response_data, service: Service1C):
    """Обновление данных для нового оператора"""
    try:
        if service.operator == "ТВИП":
            response_data["tvip"]['login'] = service.login
            response_data["tvip"]['password'] = service.password
            response_data['tvip']['service1c'].append(Service1c(id=int(service.serviceId), name=service.service, status=service.status))
        elif service.operator in ("24ТВ", "24ТВ КРД"):
            if service.operator == '24ТВ':
                token_tv24 = config.CONFIG_TV24
                response_data['tv24']['isKRD'] = False
                try:
                    response_data['tv24']['parental_code'] = await get_parental_code(int(service.userId), str(token_tv24))
                except Exception as e:
                    logger.error("Ошибка получения родительского кода для 24ТВ: %s", str(e))
                    response_data['tv24']['parental_code'] = None
            if service.operator == '24ТВ КРД':
                token_tv24 = config.CONFIG_TV24_KRD
                response_data['tv24']['isKRD'] = True
                try:
                    response_data['tv24']['parental_code'] = await get_parental_code(int(service.userId), str(token_tv24))
                except Exception as e:
                    logger.error("Ошибка получения родительского кода для 24ТВ КРД: %s", str(e))
                    response_data['tv24']['parental_code'] = None
            if service.password == 'Второй номер':
                try:
                    error_data = await get_tv24_data(service.userId, str(token_tv24))
                    if error_data:
                        for data in error_data:
                            if data.status == 'Активный':
                                if error_data:
                                    response_data['tv24']['error'] = 'Сервис подключен в доп. номере'
                    response_data['tv24']['additional_phones'].append({'phone': service.login, 'operator': service.operator})
                except Exception as e:
                    logger.error("Ошибка получения данных по доп. номеру 24ТВ: %s", str(e))
            else:
                response_data["tv24"]['phone'] = {'phone': service.login, 'operator': service.operator}
                response_data['tv24']['service1c'].append(Service1c(id=int(service.serviceId), name=service.service, status=service.status))
        elif service.operator == 'Смотрешка':
            response_data["smotreshka"]['login'] = service.login
            response_data["smotreshka"]['password'] = service.password
            response_data['smotreshka']['service1c'].append(Service1c(id=int(service.serviceId), name=service.service, status=service.status))
            response_data['smotreshka']['ban_on_app'] = service.ban_on_app
            response_data['smotreshka']['not_turnoff_if_not_used'] = service.not_turnoff_if_not_used
    except Exception as e:
        logger.error("Ошибка обновления данных для оператора %s: %s", getattr(service, 'operator', 'unknown'), str(e))
        response_data["errors"][getattr(service, 'operator', 'unknown')] = str(e)


def append_service_data(response_data, service):
    """Добавление данных для существующего оператора"""
    try:
        if service.operator == 'ТВИП':
            response_data['tvip']['service1c'].append(Service1c(id=service.serviceId, name=service.service, status=service.status))
        elif service.operator == 'Смотрешка':
            response_data['smotreshka']['service1c'].append(Service1c(id=service.serviceId, name=service.service, status=service.status))
        elif service.operator in ("24ТВ", "24ТВ КРД"):
            response_data['tv24']['service1c'].append(Service1c(id=service.serviceId, name=service.service, status=service.status))
    except Exception as e:
        logger.error("Ошибка добавления данных для оператора %s: %s", getattr(service, 'operator', 'unknown'), str(e))
        response_data["errors"][getattr(service, 'operator', 'unknown')] = str(e)


def prepare_operator_task(service):
    """Подготовка асинхронной задачи для оператора"""
    try:
        if service.operator == "ТВИП":
            return get_tvip_data(service.userId, service.service)
        elif service.operator in ("24ТВ", "24ТВ КРД"):
            token_tv24 = config.CONFIG_TV24 if service.operator == "24ТВ" else config.CONFIG_TV24_KRD
            return get_tv24_data(service.userId, str(token_tv24))
        elif service.operator == "Смотрешка":
            return get_smotreshka_data(service.login)
    except Exception as e:
        logger.error("Ошибка подготовки задачи для оператора %s: %s", getattr(service, 'operator', 'unknown'), str(e))
        return None

async def process_results(response_data, results, services_from_1c):
    """Обработка результатов запросов и сравнение данных"""
    result_idx = 0
    for service in services_from_1c:
        if service.password != 'Второй номер':
            operator = service.operator
            try:
                if operator == "ТВИП":
                    response_data["tvip"]['serviceOp'] = results[result_idx] if result_idx < len(results) else []
                    if not compare_service_data(response_data['tvip']):
                        response_data["tvip"]["error"] = "Данные не совпадают"
                elif operator in ("24ТВ", "24ТВ КРД"):
                    response_data["tv24"]['serviceOp'] = results[result_idx] if result_idx < len(results) else []
                    if not compare_service_data(response_data['tv24']):
                        response_data["tv24"]["error"] = "Данные не совпадают"
                elif operator == "Смотрешка":
                    response_data["smotreshka"]['serviceOp'] = results[result_idx] if result_idx < len(results) else []
                    if not compare_service_data(response_data['smotreshka']):
                        response_data["smotreshka"]["error"] = "Данные не совпадают"
                result_idx += 1
            except Exception as e:
                logger.error("Ошибка обработки результатов для оператора %s: %s", operator, str(e))
                response_data["errors"][operator] = str(e)

def compare_service_data(service_data):
    """Сравнение данных service1c и serviceOp по id и status"""
    try:
        service1c_data = [(int(s.id), s.status) for s in service_data['service1c'] if s.id != 0 and s.status == 'Активный']
        serviceOp_data = [(int(s.id), s.status) for s in service_data['serviceOp']]
        return set(service1c_data) == set(serviceOp_data)
    except Exception as e:
        logger.error("Ошибка сравнения данных: %s", str(e))
        return False