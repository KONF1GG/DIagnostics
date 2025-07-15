"""
Маршруты для работы с Frida.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.schemas import RedisAddressModelResponse, RedisTariffsResponse
from app.models import FridaLogs
from app.depencies import SessionDependency, TokenDependency
from app.crud import (
    get_addresses_from_redis,
    get_tariffs_from_redis,
    get_ai_response,
    get_milvus_data,
    get_last_frida_logs,
    log_frida_interaction,
)

logger = logging.getLogger(__name__)

router = APIRouter()


class FridaRequest(BaseModel):
    """Модель для POST запроса к Frida API."""

    query: str
    history_count: Optional[int] = None
    model: Optional[str] = None
    tariffs: Optional[dict] = None


def format_frida_history(logs: list[FridaLogs]) -> str:
    """
    Преобразует список логов в текстовую историю для отправки в AI.
    """
    try:
        lines = []
        for log in reversed(logs):
            lines.append(f"Пользователь: {log.query}")
            lines.append(f"Модель: {log.response}")
        return "\n".join(lines)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Ошибка форматирования истории: {str(e)}"
        ) from e


@router.post("/v1/frida", tags=["Фрида"])
async def make_request_and_get_response_from_mistral(
    request: FridaRequest,
    token: TokenDependency,
    session: SessionDependency,  # type: ignore
):
    """Эндпоинт для обработки запроса и получения ответа от AI."""
    try:
        user_id = token.user_id

        # Извлекаем данные из request body
        query = request.query
        history_count = request.history_count
        model = request.model
        tariffs = request.tariffs

        # Проверяем, переданы ли тарифы
        if tariffs:
            try:
                import json

                # В POST запросе tariffs уже dict, не нужно парсить JSON
                tariffs_data = tariffs
                # Используем тарифы как контекст вместо Milvus
                combined_context = (
                    f"Контекст тарифов: {json.dumps(tariffs_data, ensure_ascii=False)}"
                )
                mlv_hashes = []
            except Exception as e:
                logger.warning(f"Ошибка при обработке тарифов: {e}")
                # Если ошибка, делаем обычный запрос к Milvus
                mlv_data = await get_milvus_data(query)
                combined_context = mlv_data.combined_context
                mlv_hashes = mlv_data.hashs
        else:
            # Обычный запрос к Milvus, если тарифы не переданы
            try:
                mlv_data = await get_milvus_data(query)
                combined_context = mlv_data.combined_context
                mlv_hashes = mlv_data.hashs
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Ошибка получения данных из Milvus: {str(e)}",
                ) from e

        # Получение истории логов только если history_count > 0
        if history_count is not None and history_count == 0:
            chat_history_str = "нет истории диалога"
        else:
            try:
                count = history_count if history_count in (1, 2, 3) else 3
                history_logs = await get_last_frida_logs(session, user_id, limit=count)
                chat_history_str = (
                    format_frida_history(history_logs)
                    if history_logs
                    else "нет истории диалога"
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Ошибка получения истории логов: {str(e)}"
                ) from e

        try:
            mistral_response = await get_ai_response(
                text=query,
                combined_context=combined_context,
                chat_history=chat_history_str,
                input_type="text",
                model=model,
            )
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Ошибка запроса к AI: {str(e)}"
            ) from e

        try:
            # Логирование взаимодействия
            await log_frida_interaction(
                session=session,
                user_id=user_id,
                query=query,
                response=mistral_response,
                hashes=mlv_hashes,
                error=None,
            )
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Ошибка логирования взаимодействия: {str(e)}"
            ) from e

        return {"response": mistral_response}

    except HTTPException as e:
        logger.error("Mistral error: %s", e)
        try:
            await log_frida_interaction(
                session=session,
                user_id=token.user_id,
                query=query,
                response="",
                hashes=[],
                error=str(e),
            )
        except Exception as log_error:
            logger.error(
                "Ошибка логирования при обработке HTTPException: %s", str(log_error)
            )
        raise

    except Exception as e:
        logger.error("Unexpected error: %s", str(e))
        try:
            await log_frida_interaction(
                session=session,
                user_id=token.user_id,
                query=query,
                response="",
                hashes=[],
                error=str(e),
            )
        except Exception as log_error:
            logger.error(
                "Ошибка логирования при обработке Unexpected error: %s", str(log_error)
            )
        raise HTTPException(
            status_code=500, detail=f"Unexpected error: {str(e)}"
        ) from e


@router.get(
    "/v1/redis_addresses", tags=["Фрида"], response_model=RedisAddressModelResponse
)
async def get_redis_addresses(
    token: TokenDependency,
    query_address: str = Query(
        ..., min_length=3, max_length=200, description="Адрес для поиска"
    ),
):
    """
    Получает список адресов из Redis по запросу.

    Args:
        token: Токен авторизации
        query_address: Адрес для поиска (минимум 3 символа)

    Returns:
        RedisAddressModelResponse: Список найденных адресов
    """
    logger.info(f"Поиск адресов по запросу: {query_address}")

    try:
        result = await get_addresses_from_redis(query_address)

        logger.info(
            f"Найдено адресов: {len(result.addresses) if result.addresses else 0}"
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Неожиданная ошибка при поиске адресов: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка сервера при поиске адресов: {str(e)}",
        ) from e


@router.get("/v1/redis_tariff", tags=["Фрида"], response_model=RedisTariffsResponse)
async def get_redis_tariffs(
    token: TokenDependency,
    territory_id: str = Query(
        ..., min_length=1, max_length=50, description="ID территории для поиска тарифов"
    ),
):
    """
    Получает список тарифов из Redis по ID территории.

    Args:
        token: Токен авторизации
        territory_id: ID территории для поиска тарифов

    Returns:
        RedisTariffsResponse: Данные тарифов для территории
    """
    logger.info(f"Поиск тарифов для территории: {territory_id}")

    result = await get_tariffs_from_redis(territory_id)
    return RedisTariffsResponse(tariffs=result)
