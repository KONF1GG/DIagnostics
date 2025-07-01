"""
Маршруты для работы с Frida.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models import FridaLogs
from app.depencies import SessionDependency, TokenDependency
from app.crud import (
    get_ai_response,
    get_milvus_data,
    get_last_frida_logs,
    log_frida_interaction,
)

logger = logging.getLogger(__name__)

router = APIRouter()


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
        raise HTTPException(status_code=500, detail=f"Ошибка форматирования истории: {str(e)}") from e


@router.get('/v1/frida', tags=["Фрида"])
async def make_request_and_get_response_from_mistral(
    token: TokenDependency,
    session: SessionDependency,  # type: ignore
    query: str,
    history_count: Optional[int] = Query(None, ge=0, le=3),
    model: Optional[str] = Query(None),
):
    """Эндпоинт для обработки запроса и получения ответа от AI."""
    try:
        try:
            # Получение данных из Milvus
            mlv_data = await get_milvus_data(query)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка получения данных из Milvus: {str(e)}") from e

        user_id = token.user_id

        try:
            # Получение истории логов
            history_logs = await get_last_frida_logs(session, user_id, limit=history_count or 3)
            chat_history_str = format_frida_history(history_logs) if history_logs else "нет истории диалога"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка получения истории логов: {str(e)}") from e

        try:
            # Запрос к Mistral
            mistral_response = await get_ai_response(
                text=query,
                combined_context=mlv_data.combined_context,
                chat_history=chat_history_str,
                input_type="text",
                model=model,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка запроса к AI: {str(e)}") from e

        try:
            # Логирование взаимодействия
            await log_frida_interaction(
                session=session,
                user_id=user_id,
                query=query,
                response=mistral_response,
                hashes=mlv_data.hashs,
                error=None,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка логирования взаимодействия: {str(e)}") from e

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
            logger.error("Ошибка логирования при обработке HTTPException: %s", str(log_error))
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
            logger.error("Ошибка логирования при обработке Unexpected error: %s", str(log_error))
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}") from e
