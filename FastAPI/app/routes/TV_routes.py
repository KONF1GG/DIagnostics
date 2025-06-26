"""
Маршруты для работы с услугами ТВ.
"""

import asyncio
import logging
import aiohttp
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
from app.schemas import (
    # FailureDetail,
    Service1C,
    Service1c,
    TVResponse,
    TVFixResponse,
    TVDiscrepancy,
    ServiceTuple,
    TVOperatorData,
    TV24Data,
    TV24Phone,
)

# Настройка логирования
logger = logging.getLogger(__name__)

router = APIRouter()


async def get_tv_data_logic(login: str) -> TVResponse | Dict:
    """Основная логика получения данных ТВ"""
    try:
        response_data = initialize_response_data()

        try:
            services_from_1c = await get_TV_services_from_1c(login)
        except Exception as e:
            logger.error("Ошибка получения данных из 1С: %s", str(e))
            response_data["errors"]["_1c"] = (
                f"Не удалось получить данные из 1С: {str(e)}"
            )
            return response_data

        if not services_from_1c:
            response_data["errors"]["_1c"] = "Не удалось получить данные из 1С"
            return response_data

        operators = set()
        tasks = []

        for service in services_from_1c:
            try:
                if (
                    service.operator not in operators
                    or service.operator == "24ТВ"
                    or service.operator == "24ТВ КРД"
                ):
                    await update_service_data(response_data, service)
                    if service.password != "Второй номер":
                        tasks.append(prepare_operator_task(service))
                    operators.add(service.operator)
                else:
                    append_service_data(response_data, service)
            except Exception as e:
                logger.error(
                    "Ошибка обработки сервиса %s: %s",
                    getattr(service, "operator", "unknown"),
                    str(e),
                )
                response_data["errors"][getattr(service, "operator", "unknown")] = str(
                    e
                )

        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)
        except Exception as e:
            logger.error("Ошибка при выполнении задач операторов: %s", str(e))
            response_data["errors"]["gather"] = str(e)
            results = []

        await process_results(response_data, results, services_from_1c)

        # Создаем телефон для 24ТВ если есть данные
        tv24_phone = None
        if response_data["tv24"]["phone"]:
            tv24_phone = TV24Phone(**response_data["tv24"]["phone"])

        # Создаем дополнительные телефоны для 24ТВ
        additional_phones = []
        for phone_data in response_data["tv24"]["additional_phones"]:
            additional_phones.append(TV24Phone(**phone_data))

        pydantic_response = TVResponse(
            smotreshka=TVOperatorData(**response_data["smotreshka"]),
            tvip=TVOperatorData(**response_data["tvip"]),
            tv24=TV24Data(
                **{
                    k: v
                    for k, v in response_data["tv24"].items()
                    if k not in ["phone", "additional_phones"]
                },
                phone=tv24_phone,
                additional_phones=additional_phones,
            ),
            errors=response_data["errors"],
        )
        return pydantic_response
    except Exception as e:
        logger.error("Ошибка в логике получения данных ТВ: %s", str(e))
        raise HTTPException(status_code=500, detail="Ошибка получения данных ТВ") from e


def initialize_response_data():
    """Инициализация структуры данных для ответа"""
    return {
        "smotreshka": {
            "login": None,
            "password": None,
            "not_turnoff_if_not_used": None,
            "service1c": [],
            "serviceOp": [],
            "ban_on_app": None,
            "error": None,
        },
        "tvip": {
            "login": None,
            "password": None,
            "service1c": [],
            "serviceOp": [],
            "error": None,
        },
        "tv24": {
            "phone": {},
            "service1c": [],
            "serviceOp": [],
            "error": None,
            "additional_phones": [],
            "ban_on_app": False,
            "isKRD": None,
            "parental_code": None,
        },
        "errors": {},
    }


async def update_service_data(response_data, service: Service1C):
    """Обновление данных для нового оператора"""
    try:
        if service.operator == "ТВИП":
            response_data["tvip"]["login"] = service.login
            response_data["tvip"]["password"] = service.password
            response_data["tvip"]["service1c"].append(
                Service1c(
                    id=int(service.serviceId),
                    name=service.service,
                    status=service.status,
                )
            )
        elif service.operator in ("24ТВ", "24ТВ КРД"):
            if service.operator == "24ТВ":
                token_tv24 = config.CONFIG_TV24
                response_data["tv24"]["isKRD"] = False
                try:
                    response_data["tv24"]["parental_code"] = await get_parental_code(
                        int(service.userId), str(token_tv24)
                    )
                except Exception as e:
                    logger.error(
                        "Ошибка получения родительского кода для 24ТВ: %s", str(e)
                    )
                    response_data["tv24"]["parental_code"] = None
            if service.operator == "24ТВ КРД":
                token_tv24 = config.CONFIG_TV24_KRD
                response_data["tv24"]["isKRD"] = True
                try:
                    response_data["tv24"]["parental_code"] = await get_parental_code(
                        int(service.userId), str(token_tv24)
                    )
                except Exception as e:
                    logger.error(
                        "Ошибка получения родительского кода для 24ТВ КРД: %s", str(e)
                    )
                    response_data["tv24"]["parental_code"] = None
            if service.password == "Второй номер":
                try:
                    error_data = await get_tv24_data(service.userId, str(token_tv24))
                    if error_data:
                        for data in error_data:
                            if data.status == "Активный":
                                if error_data:
                                    response_data["tv24"]["error"] = (
                                        "Сервис подключен в доп. номере"
                                    )
                    response_data["tv24"]["additional_phones"].append(
                        {"phone": service.login, "operator": service.operator}
                    )
                except Exception as e:
                    logger.error(
                        "Ошибка получения данных по доп. номеру 24ТВ: %s", str(e)
                    )
            else:
                response_data["tv24"]["phone"] = {
                    "phone": service.login,
                    "operator": service.operator,
                }
                response_data["tv24"]["service1c"].append(
                    Service1c(
                        id=int(service.serviceId),
                        name=service.service,
                        status=service.status,
                    )
                )
        elif service.operator == "Смотрешка":
            response_data["smotreshka"]["login"] = service.login
            response_data["smotreshka"]["password"] = service.password
            response_data["smotreshka"]["service1c"].append(
                Service1c(
                    id=int(service.serviceId),
                    name=service.service,
                    status=service.status,
                )
            )
            response_data["smotreshka"]["ban_on_app"] = service.ban_on_app
            response_data["smotreshka"]["not_turnoff_if_not_used"] = (
                service.not_turnoff_if_not_used
            )
    except Exception as e:
        logger.error(
            "Ошибка обновления данных для оператора %s: %s",
            getattr(service, "operator", "unknown"),
            str(e),
        )
        response_data["errors"][getattr(service, "operator", "unknown")] = str(e)


def append_service_data(response_data, service):
    """Добавление данных для существующего оператора"""
    try:
        if service.operator == "ТВИП":
            response_data["tvip"]["service1c"].append(
                Service1c(
                    id=service.serviceId, name=service.service, status=service.status
                )
            )
        elif service.operator == "Смотрешка":
            response_data["smotreshka"]["service1c"].append(
                Service1c(
                    id=service.serviceId, name=service.service, status=service.status
                )
            )
        elif service.operator in ("24ТВ", "24ТВ КРД"):
            response_data["tv24"]["service1c"].append(
                Service1c(
                    id=service.serviceId, name=service.service, status=service.status
                )
            )
    except Exception as e:
        logger.error(
            "Ошибка добавления данных для оператора %s: %s",
            getattr(service, "operator", "unknown"),
            str(e),
        )
        response_data["errors"][getattr(service, "operator", "unknown")] = str(e)


def prepare_operator_task(service):
    """Подготовка асинхронной задачи для оператора"""
    try:
        if service.operator == "ТВИП":
            return get_tvip_data(service.userId, service.service)
        elif service.operator in ("24ТВ", "24ТВ КРД"):
            token_tv24 = (
                config.CONFIG_TV24
                if service.operator == "24ТВ"
                else config.CONFIG_TV24_KRD
            )
            return get_tv24_data(service.userId, str(token_tv24))
        elif service.operator == "Смотрешка":
            return get_smotreshka_data(service.login)
    except Exception as e:
        logger.error(
            "Ошибка подготовки задачи для оператора %s: %s",
            getattr(service, "operator", "unknown"),
            str(e),
        )
        return None


async def process_results(response_data, results, services_from_1c):
    """Обработка результатов запросов и сравнение данных"""
    result_idx = 0
    for service in services_from_1c:
        if service.password != "Второй номер":
            operator = service.operator
            try:
                if operator == "ТВИП":
                    response_data["tvip"]["serviceOp"] = (
                        results[result_idx] if result_idx < len(results) else []
                    )
                    if not compare_service_data(response_data["tvip"]):
                        response_data["tvip"]["error"] = "Данные не совпадают"
                elif operator in ("24ТВ", "24ТВ КРД"):
                    response_data["tv24"]["serviceOp"] = (
                        results[result_idx] if result_idx < len(results) else []
                    )
                    if not compare_service_data(response_data["tv24"]):
                        response_data["tv24"]["error"] = "Данные не совпадают"
                elif operator == "Смотрешка":
                    response_data["smotreshka"]["serviceOp"] = (
                        results[result_idx] if result_idx < len(results) else []
                    )
                    if not compare_service_data(response_data["smotreshka"]):
                        response_data["smotreshka"]["error"] = "Данные не совпадают"
                result_idx += 1
            except Exception as e:
                logger.error(
                    "Ошибка обработки результатов для оператора %s: %s",
                    operator,
                    str(e),
                )
                response_data["errors"][operator] = str(e)


def compare_service_data(service_data):
    """Сравнение данных service1c и serviceOp по id и status"""
    if isinstance(service_data, TVOperatorData) or isinstance(service_data, TV24Data) :

        try:
            service1c_data = [
                (int(s.id), s.status)
                for s in service_data.service1c
                if s.id != 0 and s.status == "Активный"
            ]
            serviceOp_data = [(int(s.id), s.status) for s in service_data.serviceOp]
            return set(service1c_data) == set(serviceOp_data)
        except Exception as e:
            logger.error("Ошибка сравнения данных: %s", str(e))
            return False
    else:
        try:
            service1c_data = [
                (int(s.id), s.status)
                for s in service_data["service1c"]
                if s.id != 0 and s.status == "Активный"
            ]
            serviceOp_data = [(int(s.id), s.status) for s in service_data["serviceOp"]]
            return set(service1c_data) == set(serviceOp_data)
        except Exception as e:
            logger.error("Ошибка сравнения данных: %s", str(e))
            return False

def detect_discrepancies(response_data: TVResponse):
    """Обнаружение расхождений в данных ТВ"""
    discrepancies = {}

    # Проверяем каждого оператора
    for operator in ["tvip", "tv24", "smotreshka"]:
        operator_data = getattr(response_data, operator, None)
        if operator_data:
            if not compare_service_data(operator_data):
                service1c_data = [
                    (int(s.id), s.status)
                    for s in operator_data.service1c
                    if s.id != 0 and s.status == "Активный"
                ]
                serviceOp_data = [
                    (int(s.id), s.status) for s in operator_data.serviceOp
                ]

                discrepancies[operator] = {
                    "service1c_data": service1c_data,
                    "serviceOp_data": serviceOp_data,
                    "missing_in_operator": list(
                        set(service1c_data) - set(serviceOp_data)
                    ),
                    "extra_in_operator": list(
                        set(serviceOp_data) - set(service1c_data)
                    ),
                }

    return discrepancies


async def call_correct_tv_api(login: str, operator: str, response_data) -> dict:
    """Вызов API исправления статусов ТВ"""
    url = config.TV_FIX

    operator_mapping = {
        'tv24': '24ТВ КРД' if response_data.tv24.isKRD else '24ТВ',
        'tvip': 'ТВИП',
        'Smotreshka': 'Смотрешка',
    }

    payload = {"login": login, "operator": operator_mapping.get(operator, operator)}
    headers = {"Content-Type": "application/json"}

    try:
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=config.EXTERNAL_API_TIMEOUT)
        ) as session:
            async with session.post(url or '', json=payload, headers=headers) as response:
                if response.status == 200:
                    return {"status": "success", "message": "Синхронизация статусов запущена"}
                else:
                    error_text = await response.text()
                    return {
                        "status": "error",
                        "message": f"Ошибка: {response.reason or 'Не удалось запустить синхронизацию'}",
                        "error_details": error_text,
                    }
    except asyncio.TimeoutError:
        return {"status": "error", "message": "Таймаут при обращении к API исправления ТВ"}
    except Exception as e:
        logger.error("Ошибка вызова API исправления ТВ: %s", str(e))
        return {"status": "error", "message": f"Ошибка: {str(e)}"}



@router.get("/v1/TV", response_model=TVResponse, tags=["ТВ"])
async def get_connection_data(
    # token: TokenDependency,
    login: Optional[str] = Query(None),
):
    """Эндпоинт для получения информации по услугам ТВ"""
    try:
        if not login:
            raise HTTPException(status_code=400, detail="Логин не указан")

        response_data = await get_tv_data_logic(login)

        if isinstance(response_data, dict):
            tv24_phone = None
            if response_data["tv24"]["phone"]:
                tv24_phone = TV24Phone(**response_data["tv24"]["phone"])

            # Создаем дополнительные телефоны для 24ТВ
            additional_phones = []
            for phone_data in response_data["tv24"]["additional_phones"]:
                additional_phones.append(TV24Phone(**phone_data))

            return TVResponse(
                smotreshka=TVOperatorData(**response_data["smotreshka"]),
                tvip=TVOperatorData(**response_data["tvip"]),
                tv24=TV24Data(
                    **{
                        k: v
                        for k, v in response_data["tv24"].items()
                        if k not in ["phone", "additional_phones"]
                    },
                    phone=tv24_phone,
                    additional_phones=additional_phones,
                ),
                errors=response_data["errors"],
            )
        else:
            # Если уже TVResponse, возвращаем как есть
            return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Внутренняя ошибка эндпоинта ТВ: %s", str(e))
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера") from e
    
@router.post("/v1/TV/fix", response_model=TVFixResponse, tags=["ТВ"])
async def fix_tv_discrepancies_endpoint(login: Optional[str] = Query(None)):
    """Эндпоинт для проверки и исправления расхождений в услугах ТВ"""
    try:
        if not login:
            raise HTTPException(status_code=400, detail="Логин не указан")

        # Получаем данные ТВ
        try:
            response_data = await get_tv_data_logic(login)
        except Exception as e:
            logger.error("Ошибка получения данных ТВ для исправления: %s", str(e))
            raise HTTPException(
                status_code=500, detail="Ошибка получения данных ТВ"
            ) from e

        # Обнаруживаем расхождения
        try:
            if isinstance(response_data, TVResponse):
                discrepancies = detect_discrepancies(response_data)
            else:
                raise HTTPException(status_code=400, detail='Ошибка преобразования данных')
        except Exception as e:
            logger.error("Ошибка обнаружения расхождений: %s", str(e))
            raise HTTPException(status_code=500, detail="Ошибка анализа данных") from e

        if not discrepancies or (not discrepancies.get('service1c_data') and not discrepancies.get('serviceOp_data')):
            return TVFixResponse(
                status="success",
                message="Расхождений не обнаружено",
                discrepancies={},
            )

        # Отправка запроса на исправление
        fix_results = {}
        failed_fixes = []
        status = 'success'
        for operator, data in discrepancies.items():
            try:
                result = await call_correct_tv_api(login, operator, response_data)
                fix_results[operator] = result
                if result.get("status") != "success":
                    failed_fixes.append(operator)
            except Exception as e:
                logger.error("Ошибка исправления для оператора %s: %s", operator, str(e))
                fix_results[operator] = {
                    "status": "error",
                    "message": f"Ошибка при исправлении: {str(e)}",
                }
                failed_fixes.append(operator)

        # Преобразуем данные в Pydantic схемы
        pydantic_discrepancies = {}
        for operator, data in discrepancies.items():
            pydantic_discrepancies[operator] = TVDiscrepancy(
                service1c_data=[
                    ServiceTuple(id=t[0], status=t[1])
                    for t in data.get("service1c_data", [])
                ],
                serviceOp_data=[
                    ServiceTuple(id=t[0], status=t[1])
                    for t in data.get("serviceOp_data", [])
                ],
                missing_in_operator=[
                    ServiceTuple(id=t[0], status=t[1])
                    for t in data.get("missing_in_operator", [])
                ],
                extra_in_operator=[
                    ServiceTuple(id=t[0], status=t[1])
                    for t in data.get("extra_in_operator", [])
                ],
            )

        message = "Исправление запущено"
        if failed_fixes:
            message += f", но не удалось запустить исправление для операторов: {', '.join(failed_fixes)}"
            status = 'partial_success'
        
        if len(discrepancies) == len(failed_fixes):
            message = "Не удалось запустить механизм исправления"
            status = 'error'
        return TVFixResponse(
            status=status,
            message=message,
            discrepancies=pydantic_discrepancies,
            fix_results=fix_results,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Внутренняя ошибка эндпоинта исправления ТВ: %s", str(e))
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера") from e


