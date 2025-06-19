import asyncio
from typing import Optional
import aiohttp
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta, timezone
from schemas import CategoryStatus, IntercomResponse, Passage
import crud
from depencies import RBTDependency, RedisDependency, TokenDependency
import logging

# Настройка логирования
logger = logging.getLogger(__name__)

router = APIRouter()
# Часовой пояс GMT+05:00
GMT_PLUS_5 = timezone(timedelta(hours=5))
DAYS_TO_FETCH = 5
RBT_API_URL = "https://rbt.freedom1.ru/mobile/address/plog"
CATEGORIES_OF_INTEREST = ["barrier", "intercom", "intercomhandset"]

# Преобразование даты из 1С в точный timestamp (00:00:00 GMT+05:00)
def date_string_to_timestamp(date_str: str) -> Optional[int]:
    try:
        date = datetime.strptime(date_str, "%d.%m.%Y")
        date = date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=GMT_PLUS_5)
        return int(date.timestamp())
    except ValueError as e:
        logger.error(f"Неверный формат даты: {date_str} - {str(e)}")
        return None

# Получение timestamp начала дня в GMT+05:00 для сравнения
def get_start_of_day_timestamp(timestamp: int) -> Optional[int]:
    try:
        dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)
        dt = dt.astimezone(GMT_PLUS_5).replace(hour=0, minute=0, second=0, microsecond=0)
        return int(dt.timestamp())
    except (ValueError, TypeError) as e:
        logger.error(f"Ошибка преобразования timestamp: {timestamp} - {str(e)}")
        return None

async def get_token(flat_id: int, rbt: RBTDependency) -> str:
    token = await crud.get_RBT_token(flat_id, rbt)
    if not token:
        raise HTTPException(status_code=400, detail=f"Токен для flat_id {flat_id} не найден")
    return token

async def fetch_passages(session: aiohttp.ClientSession, flat_id: int, date: datetime, token: str) -> list:
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"flatId": flat_id, "day": date.strftime("%Y-%m-%d")}
    passages = []

    try:
        async with session.post(RBT_API_URL, json=payload, headers=headers) as response:
            if response.status == 200:
                data = (await response.json())["data"]
                event_types = {
                    1: "неотвеченный вызов",
                    2: "отвеченный вызов",
                    3: "открытие ключом",
                    4: "открытие из приложения",
                    5: "открытие лицом",
                    6: "открытие кодом",
                    7: "открытие ворот звонком",
                }
                for entry in data:
                    try:
                        parsed_date = datetime.strptime(entry["date"], "%Y-%m-%d %H:%M:%S")
                        adjusted_date = parsed_date + timedelta(hours=2)
                        passages.append(Passage(
                            date=adjusted_date,
                            address=entry.get("mechanizmaDescription", ""),
                            type=event_types.get(int(entry["event"]), "неизвестный тип")
                        ))
                    except (KeyError, ValueError) as e:
                        logger.error(f"Ошибка обработки записи для flat_id {flat_id}, дата {date}: {e}")
            else:
                logger.error(f"Ошибка API для flat_id {flat_id}, дата {date}: {response.status}")
    except Exception as e:
        logger.error(f"Исключение для flat_id {flat_id}, дата {date}: {e}")
    
    return passages

async def get_passages_for_flat(flat_id: int, rbt: RBTDependency, days: int = DAYS_TO_FETCH) -> list:
    passages = []
    try:
        token = await get_token(flat_id, rbt)
        async with aiohttp.ClientSession() as session:
            tasks = [
                fetch_passages(session, flat_id, datetime.now(tz=GMT_PLUS_5) - timedelta(days=i), token)
                for i in range(days)
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for result in results:
                if isinstance(result, list):
                    passages.extend(result)
                else:
                    logger.error(f"Ошибка в задаче для flat_id {flat_id}: {result}")
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Ошибка получения проходов для flat_id {flat_id}: {e}")
    return passages

@router.get('/v1/intercom', response_model=IntercomResponse)
async def get_data_for_intercom_page(
    redis: RedisDependency,
    rbt: RBTDependency,
    token: TokenDependency,
    login: Optional[str] = Query(None),

):
    """Эндпоинт для получения данных о домофоне, включая данные о проходах."""
    if not login:
        raise HTTPException(status_code=400, detail="Login parameter is required")
    
    errors = []
    
    # Параллельное выполнение запросов
    services_1c_task = crud.get_1c_intercom_services(login)
    redis_data_task = crud.get_redis_key_data(login, redis)
    results = await asyncio.gather(services_1c_task, redis_data_task, return_exceptions=True)
    
    services_1c, redis_data = results
    if isinstance(redis_data, Exception):
        errors.append(f"Ошибка при получении данных из Redis: {str(redis_data)}")
        redis_data = {}
    
    if redis_data.get('rbt') is False:
        return IntercomResponse(
            categories=[CategoryStatus(category=cat, status="missing", service=None) for cat in CATEGORIES_OF_INTEREST],
            errors=["RBT is disabled for this login"],
            update_instructions=None,
            aps_settings=None,
            rbt_link="",
            passages=[]
        )
    
    flat_id = redis_data.get('flatId')
    passages_task = get_passages_for_flat(flat_id, rbt) if flat_id else None
    
    # Обработка результатов
    services_redis = redis_data.get("servicecats", {}) if isinstance(redis_data, dict) else {}
    if isinstance(services_1c, Exception):
        errors.append(f"Ошибка при получении данных из 1C: {str(services_1c)}")
        services_1c = []
    
    # Обработка данных из 1С
    services_1c_dict = {}
    for service in services_1c or []:
        categories = service.category.split(',') if hasattr(service, 'category') else []
        for category in categories:
            category = category.strip()
            if category in CATEGORIES_OF_INTEREST:
                timeto = date_string_to_timestamp(service.timeto) if hasattr(service, 'timeto') else None
                if timeto is not None:
                    services_1c_dict[category] = {
                        "time_to": timeto,
                        "service": getattr(service, 'service', None)
                    }
                else:
                    errors.append(f"Ошибка в дате 1С для {category}")

    # Обработка данных из Redis
    services_redis_dict = {}
    for category, data in services_redis.items():
        if category in CATEGORIES_OF_INTEREST and isinstance(data, dict) and "timeto" in data:
            try:
                timeto = int(data["timeto"])
                services_redis_dict[category] = timeto
            except (ValueError, TypeError):
                errors.append(f"Ошибка в timeto Redis для {category}: {data.get('timeto', 'unknown')}")

    # Сравнение категорий
    categories_status = []
    has_discrepancies = False
    
    for category in CATEGORIES_OF_INTEREST:
        service_1c = services_1c_dict.get(category, {})
        timeto_1c = service_1c.get('time_to') if service_1c else None
        timeto_redis = services_redis_dict.get(category)
        
        timeto_1c_for_comparison = get_start_of_day_timestamp(timeto_1c) if timeto_1c is not None else None
        timeto_redis_for_comparison = get_start_of_day_timestamp(timeto_redis) if timeto_redis is not None else None
        
        if timeto_1c is not None and timeto_redis is not None:
            status = "match" if timeto_1c_for_comparison == timeto_redis_for_comparison else "discrepancy"
            has_discrepancies = has_discrepancies or status == "discrepancy"
        elif timeto_1c is not None:
            status = "only_in_1c"
            has_discrepancies = True
        elif timeto_redis is not None:
            status = "only_in_redis"
            has_discrepancies = True
        else:
            status = "missing"
        
        categories_status.append(CategoryStatus(
            service=service_1c.get('service') if service_1c else None,
            category=category,
            timeto_1c=timeto_1c,
            timeto_redis=timeto_redis,
            status=status
        ))
    
    # Инструкции по обновлению
    update_instructions = None
    if has_discrepancies:
        update_instructions = (
            "Для обновления данных в Redis:\n"
            "1. Зайдите в карточку договора\n"
            "2. Перейдите в 'Управление договором'\n"
            "3. Откройте вкладку 'Логины'\n"
            "4. Дважды кликните на строку с логином\n"
            "5. Нажмите 'Записать и закрыть'\n"
            "Данные обновятся в течение 5 минут."
        )

    # Получение настроек APS и ссылка RBT
    aps_settings = await crud.get_RBT_aps_settings(flat_id, rbt) if flat_id else None
    rbt_link = f'https://rbt.freedom1.ru/?#addresses.houses&houseId={aps_settings.address_house_id}' if aps_settings and hasattr(aps_settings, 'address_house_id') else ''

    # Получение данных о проходах
    passages = await passages_task if passages_task else []

    return IntercomResponse(
        categories=categories_status,
        errors=errors,
        update_instructions=update_instructions,
        aps_settings=aps_settings,
        rbt_link=rbt_link,
        passages=passages
    )