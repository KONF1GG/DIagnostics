import asyncio
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Optional

from pydantic import ValidationError
from redis import ResponseError
from app import crud
from app.depencies import RedisDependency, SessionRediusDependency, TokenDependency
from app.schemas import TV24, TVIP, Service1C, Service1c, ServiceOp, Smotreshka, TVResponse
from app import config

router = APIRouter()

@router.get('/v1/TV', response_model=Dict)
async def get_connection_data(
    token: TokenDependency,
    login: Optional[str] = Query(None)
):
    """Эндпоинт для получения информации по услугам ТВ"""
    if not login:
        raise HTTPException(status_code=400, detail="Логин не указан")

    response_data = initialize_response_data()
    services_from_1c = await crud.get_TV_services_from_1c(login)

    if not services_from_1c:
        response_data["errors"]["_1c"] = "Не удалось получить данные из 1С"
        return response_data

    operators = set()
    tasks = []

    for service in services_from_1c:
        if service.operator not in operators or service.operator == '24ТВ' or service.operator == '24ТВ КРД':
            await update_service_data(response_data, service)
            if service.password != 'Второй номер':
                tasks.append(prepare_operator_task(service))
            operators.add(service.operator)
        else:
            append_service_data(response_data, service)

    results = await asyncio.gather(*tasks, return_exceptions=True)

    await process_results(response_data, results, services_from_1c)
    return response_data

def initialize_response_data():
    """Инициализация структуры данных для ответа"""
    return {
        "smotreshka": {"login": None, "password": None, "not_turnoff_if_not_used": None, "service1c": [], "serviceOp": [], "ban_on_app": None, "error": None},
        "tvip": {"login": None, "password": None, "service1c": [], "serviceOp": [], "error": None},
        "tv24": {"phone": {}, "service1c": [], "serviceOp": [], "error": None, "additional_phones": [], "ban_on_app": False, "isKRD": None},
        "errors": {}
    }

async def update_service_data(response_data, service):
    """Обновление данных для нового оператора"""
    if service.operator == "ТВИП":
        response_data["tvip"]['login'] = service.login
        response_data["tvip"]['password'] = service.password
        response_data['tvip']['service1c'].append(Service1c(id=service.serviceId, name=service.service, status=service.status))
    elif service.operator in ("24ТВ", "24ТВ КРД"):
        if service.operator == '24ТВ':
            token_tv24 = config.CONFIG_TV24
            response_data['tv24']['isKRD'] = False
        if service.operator == '24ТВ КРД':
            token_tv24 = config.CONFIG_TV24_KRD
            response_data['tv24']['isKRD'] = True
        if service.password == 'Второй номер':
            error_data = await crud.get_tv24_data(service.userId, token_tv24)
            if error_data:
                for data in error_data:
                    if data.status == 'Активный':
                        if error_data:
                            response_data['tv24']['error'] = 'Сервис подключен в доп. номере'
            response_data['tv24']['additional_phones'].append({'phone': service.login, 'operator': service.operator})
        else:
            response_data["tv24"]['phone'] = {'phone': service.login, 'operator': service.operator}
            response_data['tv24']['service1c'].append(Service1c(id=service.serviceId, name=service.service, status=service.status))
    elif service.operator == 'Смотрешка':
        response_data["smotreshka"]['login'] = service.login
        response_data["smotreshka"]['password'] = service.password
        response_data['smotreshka']['service1c'].append(Service1c(id=service.serviceId, name=service.service, status=service.status))
        response_data['smotreshka']['ban_on_app'] = service.ban_on_app
        response_data['smotreshka']['not_turnoff_if_not_used'] = service.not_turnoff_if_not_used
        

def append_service_data(response_data, service):
    """Добавление данных для существующего оператора"""
    if service.operator == 'ТВИП':
        response_data['tvip']['service1c'].append(Service1c(id=service.serviceId, name=service.service, status=service.status))
    elif service.operator == 'Смотрешка':
        response_data['smotreshka']['service1c'].append(Service1c(id=service.serviceId, name=service.service, status=service.status))
    elif service.operator in ("24ТВ", "24ТВ КРД"):
        response_data['tv24']['service1c'].append(Service1c(id=service.serviceId, name=service.service, status=service.status))

def prepare_operator_task(service):
    """Подготовка асинхронной задачи для оператора"""
    if service.operator == "ТВИП":
        return crud.get_tvip_data(service.userId, service.service)
    elif service.operator in ("24ТВ", "24ТВ КРД"):
        token_tv24 = config.CONFIG_TV24 if service.operator == "24ТВ" else config.CONFIG_TV24_KRD
        return crud.get_tv24_data(service.userId, token_tv24)
    elif service.operator == "Смотрешка":
        return crud.get_smotreshka_data(service.login)

async def process_results(response_data, results, services_from_1c):
    """Обработка результатов запросов и сравнение данных"""
    result_idx = 0
    for service in services_from_1c:
        if service.password != 'Второй номер':
            operator = service.operator
            try:
                if operator == "ТВИП":
                    response_data["tvip"]['serviceOp'] = results[result_idx]
                    if not compare_service_data(response_data['tvip']):
                        response_data["tvip"]["error"] = "Данные не совпадают"
                elif operator in ("24ТВ", "24ТВ КРД"):
                    response_data["tv24"]['serviceOp'] = results[result_idx]
                    if not compare_service_data(response_data['tv24']):
                        response_data["tv24"]["error"] = "Данные не совпадают"
                elif operator == "Смотрешка":
                    response_data["smotreshka"]['serviceOp'] = results[result_idx]
                    if not compare_service_data(response_data['smotreshka']):
                        response_data["smotreshka"]["error"] = "Данные не совпадают"
                result_idx += 1
            except Exception as e:
                response_data["errors"][operator] = str(e)

def compare_service_data(service_data):
    """Сравнение данных service1c и serviceOp по id и status"""

    service1c_data = [(int(s.id), s.status) for s in service_data['service1c'] if s.id != '0' and s.status == 'Активный']
    serviceOp_data = [(int(s.id), s.status) for s in service_data['serviceOp']]
    
    return set(service1c_data) == set(serviceOp_data)