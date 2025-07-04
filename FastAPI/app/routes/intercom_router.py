"""
Маршруты для работы с домофонией.
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import aiohttp
from fastapi import APIRouter, HTTPException, Query

from app.crud import (
    get_RBT_token,
    get_1c_intercom_services,
    get_redis_key_data,
    get_RBT_aps_settings,
)
from app.depencies import RBTDependency, RedisDependency, TokenDependency
from app.schemas import (
    CategoryStatus,
    FixManualBlockRequest,
    FixManualBlockResponse,
    IntercomResponse,
    Passage,
)

# Настройка логирования
logger = logging.getLogger(__name__)

router = APIRouter()

# Константы
DAYS_TO_FETCH = 5

GMT_PLUS_5 = timezone(timedelta(hours=5))
RBT_API_URL = "https://rbt.freedom1.ru/mobile/address/plog"
CATEGORIES_OF_INTEREST = ["barrier", "intercom", "intercomhandset"]


def date_string_to_timestamp(date_str: str) -> Optional[int]:
    """
    Преобразует строку даты из 1С в timestamp (00:00:00 GMT+05:00).
    """
    try:
        date = datetime.strptime(date_str, "%d.%m.%Y")
        date = date.replace(
            hour=0, minute=0, second=0, microsecond=0, tzinfo=GMT_PLUS_5
        )
        return int(date.timestamp())
    except ValueError as e:
        logger.error("Неверный формат даты: %s - %s", date_str, str(e))
        return None


def get_start_of_day_timestamp(timestamp: int) -> Optional[int]:
    """
    Получает timestamp начала дня в GMT+05:00 для сравнения.
    """
    try:
        dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)
        dt = dt.astimezone(GMT_PLUS_5).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        return int(dt.timestamp())
    except (ValueError, TypeError) as e:
        logger.error("Ошибка преобразования timestamp: %s - %s", timestamp, str(e))
        return None


async def get_token(flat_id: int, rbt: RBTDependency) -> str:
    try:
        token = await get_RBT_token(flat_id, rbt)
        if not token:
            raise HTTPException(
                status_code=400, detail=f"Токен для flat_id {flat_id} не найден"
            )
        return token
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Ошибка при получении токена для flat_id %s: %s", flat_id, str(e))
        raise HTTPException(
            status_code=500, detail=f"Ошибка при получении токена для flat_id {flat_id}"
        ) from e

async def fetch_passages(
    session: aiohttp.ClientSession, flat_id: int, date: datetime, token: str
) -> list:
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"flatId": flat_id, "day": date.strftime("%Y-%m-%d")}
    passages = []

    try:
        async with session.post(RBT_API_URL, json=payload, headers=headers) as response:
            if response.status == 200:
                try:
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
                            parsed_date = datetime.strptime(
                                entry["date"], "%Y-%m-%d %H:%M:%S"
                            )
                            adjusted_date = parsed_date + timedelta(hours=2)
                            passages.append(
                                Passage(
                                    date=adjusted_date,
                                    address=entry.get("mechanizmaDescription", ""),
                                    type=event_types.get(
                                        int(entry["event"]), "неизвестный тип"
                                    ),
                                )
                            )
                        except (KeyError, ValueError) as e:
                            logger.error(
                                "Ошибка обработки записи для flat_id %s, дата %s: %s",
                                flat_id,
                                date,
                                e,
                            )
                except (KeyError, ValueError) as e:
                    logger.error(
                        "Ошибка парсинга ответа API для flat_id %s, дата %s: %s",
                        flat_id,
                        date,
                        e,
                    )
            else:
                logger.error(
                    "Ошибка API для flat_id %s, дата %s: %s",
                    flat_id,
                    date,
                    response.status,
                )
                
    except Exception as e:
        logger.error("Исключение для flat_id %s, дата %s: %s", flat_id, date, e)

    return passages

async def get_passages_for_flat(
    flat_id: int, rbt: RBTDependency, days: int = DAYS_TO_FETCH
) -> list:
    passages = []
    try:
        token = await get_token(flat_id, rbt)
        try:
            async with aiohttp.ClientSession() as session:
                tasks = [
                    fetch_passages(
                        session,
                        flat_id,
                        datetime.now(tz=GMT_PLUS_5) - timedelta(days=i),
                        token,
                    )
                    for i in range(days)
                ]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                for result in results:
                    if isinstance(result, list):
                        passages.extend(result)
                    else:
                        logger.error(f"Ошибка в задаче для flat_id {flat_id}: {result}")
        except Exception as e:
            logger.error(f"Ошибка при создании сессии или выполнении задач для flat_id {flat_id}: {e}")
            raise HTTPException(
                status_code=500, 
                detail=f"Ошибка при получении проходов для flat_id {flat_id}"
            ) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка получения проходов для flat_id {flat_id}: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Ошибка получения проходов для flat_id {flat_id}"
        ) from e
    return passages


@router.get("/v1/intercom", response_model=IntercomResponse, tags=["Домофон"])
async def get_data_for_intercom_page(
    redis: RedisDependency,
    rbt: RBTDependency,
    token: TokenDependency,
    login: Optional[str] = Query(None),
):
    """
    Эндпоинт для получения данных о домофоне, включая данные о проходах.
    """
    try:
        if not login:
            raise HTTPException(status_code=400, detail="Login parameter is required")

        errors = []

        # Параллельное выполнение запросов
        try:
            services_1c_task = get_1c_intercom_services(login)
            redis_data_task = get_redis_key_data(login, redis)
            results = await asyncio.gather(
                services_1c_task, redis_data_task, return_exceptions=True
            )
        except Exception as e:
            logger.error("Ошибка при выполнении параллельных запросов для login %s: %s", login, str(e))
            raise HTTPException(
                status_code=500, 
                detail="Ошибка при получении данных из внешних источников"
            ) from e

        services_1c, redis_data = results
        if isinstance(redis_data, Exception):
            errors.append(f"Ошибка при получении данных из Redis: {str(redis_data)}")
            redis_data_dict = {}
        else:
            redis_data_dict = redis_data if isinstance(redis_data, dict) else {}
        
        if redis_data_dict.get("rbt") is False:
            return IntercomResponse(
                categories=[
                    CategoryStatus(category=cat, status="missing", service=None)
                    for cat in CATEGORIES_OF_INTEREST
                ],
                errors=["RBT is disabled for this login"],
                update_instructions=None,
                aps_settings=None,
                rbt_link="",
                passages=[],
            )

        flat_id = redis_data_dict.get("flatId")
        passages_task = None
        if flat_id:
            try:
                passages_task = get_passages_for_flat(flat_id, rbt)
            except Exception as e:
                logger.error("Ошибка при создании задачи получения проходов для flat_id %s: %s", flat_id, str(e))
                errors.append(f"Ошибка при получении проходов: {str(e)}")

        # Обработка результатов
        try:
            services_redis = (
                redis_data.get("servicecats", {}) if isinstance(redis_data, dict) else {}
            )
            if isinstance(services_1c, Exception):
                errors.append(f"Ошибка при получении данных из 1C: {str(services_1c)}")
                services_1c = []

            # Обработка данных из 1С
            services_1c_dict = {}
            for service in services_1c if isinstance(services_1c, list) else []:
                try:
                    categories = service.category.split(",") if hasattr(service, "category") else []
                    for category in categories:
                        category = category.strip()
                        if category in CATEGORIES_OF_INTEREST:
                            timeto = (
                                date_string_to_timestamp(service.timeto)
                                if hasattr(service, "timeto")
                                else None
                            )
                            if timeto is not None:
                                services_1c_dict[category] = {
                                    "time_to": timeto,
                                    "service": getattr(service, "service", None),
                                }
                            else:
                                errors.append(f"Ошибка в дате 1С для {category}")
                except Exception as e:
                    logger.error("Ошибка при обработке сервиса 1С: %s", str(e))
                    errors.append(f"Ошибка при обработке сервиса из 1С: {str(e)}")

            # Обработка данных из Redis
            services_redis_dict = {}
            for category, data in services_redis.items():
                try:
                    if (
                        category in CATEGORIES_OF_INTEREST
                        and isinstance(data, dict)
                        and "timeto" in data
                    ):
                        try:
                            timeto = int(data["timeto"])
                            services_redis_dict[category] = timeto
                        except (ValueError, TypeError) as e:
                            logger.error("Ошибка в timeto Redis для %s: %s - %s", category, data.get('timeto', 'unknown'), str(e))
                            errors.append(
                                f"Ошибка в timeto Redis для {category}: {data.get('timeto', 'unknown')}"
                            )
                except Exception as e:
                    logger.error("Ошибка при обработке данных Redis для категории %s: %s", category, str(e))
                    errors.append(f"Ошибка при обработке данных Redis для {category}: {str(e)}")

            # Сравнение категорий
            categories_status = []
            has_discrepancies = False

            try:
                for category in CATEGORIES_OF_INTEREST:
                    try:
                        service_1c = services_1c_dict.get(category, {})
                        timeto_1c = service_1c.get("time_to") if service_1c else None
                        timeto_redis = services_redis_dict.get(category)

                        timeto_1c_for_comparison = (
                            get_start_of_day_timestamp(timeto_1c) if timeto_1c is not None else None
                        )
                        timeto_redis_for_comparison = (
                            get_start_of_day_timestamp(timeto_redis)
                            if timeto_redis is not None
                            else None
                        )

                        if timeto_1c is not None and timeto_redis is not None:
                            status = (
                                "match"
                                if timeto_1c_for_comparison == timeto_redis_for_comparison
                                else "discrepancy"
                            )
                            has_discrepancies = has_discrepancies or status == "discrepancy"
                        elif timeto_1c is not None:
                            status = "only_in_1c"
                            has_discrepancies = True
                        elif timeto_redis is not None:
                            status = "only_in_redis"
                            has_discrepancies = True
                        else:
                            status = "missing"

                        categories_status.append(
                            CategoryStatus(
                                service=service_1c.get("service") if service_1c else None,
                                category=category,
                                timeto_1c=timeto_1c,
                                timeto_redis=timeto_redis,
                                status=status,
                            )
                        )
                    except Exception as e:
                        logger.error("Ошибка при обработке категории %s: %s", category, str(e))
                        errors.append(f"Ошибка при обработке категории {category}: {str(e)}")
                        categories_status.append(
                            CategoryStatus(
                                service=None,
                                category=category,
                                timeto_1c=None,
                                timeto_redis=None,
                                status="error",
                            )
                        )
            except Exception as e:
                logger.error("Ошибка при сравнении категорий: %s", str(e))
                errors.append(f"Ошибка при сравнении категорий: {str(e)}")
                categories_status = [
                    CategoryStatus(category=cat, status="error", service=None)
                    for cat in CATEGORIES_OF_INTEREST
                ]

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
            aps_settings = None
            rbt_link = ""
            if flat_id:
                try:
                    aps_settings = await get_RBT_aps_settings(flat_id, rbt)
                    rbt_link = (
                        f"https://rbt.freedom1.ru/?#addresses.houses&houseId={aps_settings.address_house_id}"
                        if aps_settings and hasattr(aps_settings, "address_house_id")
                        else ""
                    )
                except Exception as e:
                    logger.error("Ошибка при получении настроек APS для flat_id %s: %s", flat_id, str(e))
                    errors.append(f"Ошибка при получении настроек APS: {str(e)}")

            # Получение данных о проходах
            passages = []
            if passages_task:
                try:
                    passages = await passages_task
                except Exception as e:
                    logger.error("Ошибка при получении проходов: %s", str(e))
                    errors.append(f"Ошибка при получении проходов: {str(e)}")

            return IntercomResponse(
                categories=categories_status,
                errors=errors,
                update_instructions=update_instructions,
                aps_settings=aps_settings,
                rbt_link=rbt_link,
                passages=passages,
            )
        except Exception as e:
            logger.error("Ошибка при обработке данных для login %s: %s", login, str(e))
            raise HTTPException(
                status_code=500, 
                detail="Ошибка при обработке данных домофона"
            ) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Неожиданная ошибка в эндпоинте домофона для login %s: %s", login, str(e))
        raise HTTPException(
            status_code=500, 
            detail="Внутренняя ошибка сервера"
        ) from e


@router.post(
    "/v1/intercom/fix-manual-block",
    status_code=200,
    response_model=FixManualBlockResponse,
    tags=["Домофон"],
)
async def fix_manual_block(
    rbt: RBTDependency,
    request_data: FixManualBlockRequest,
):
    """
    Эндпоинт для исправления ручного отключения домофонии (manual_block).

    Возвращает:
    - 200: если значение было изменено
    - 400: если manual_block уже был 0
    - 404: если квартира не найдена
    """
    try:
        async with rbt.transaction():
            # Проверяем текущее значение
            current = await rbt.fetchval(
                "SELECT manual_block FROM houses_flats WHERE house_flat_id = $1",
                request_data.house_flat_id,
            )

            if current is None:
                raise HTTPException(status_code=404, detail="Квартира не найдена")

            if not current:
                raise HTTPException(
                    status_code=400, detail="Manual_block уже установлен в 0"
                )

            # Обновляем значение
            await rbt.execute(
                "UPDATE houses_flats SET manual_block = FALSE WHERE house_flat_id = $1",
                request_data.house_flat_id,
            )

            logger.info(
                "Обновлён manual_block для квартиры %s", request_data.house_flat_id
            )
            return {
                "status": "success",
                "message": "Manual_block установлен в 0",
                "changed": True,
                "house_flat_id": request_data.house_flat_id,
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Ошибка при обновлении manual_block: %s", str(e))
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера") from e
