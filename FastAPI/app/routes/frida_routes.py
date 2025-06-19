from typing import Optional
from fastapi import APIRouter, HTTPException, Query
import logging

from models import FridaLogs
from depencies import SessionDependency, TokenDependency
import crud

logger = logging.getLogger(__name__)

router = APIRouter()

def format_frida_history(logs: list[FridaLogs]) -> str:
    """
    Преобразует список логов в текстовую историю для отправки в Mistral
    """
    lines = []
    for log in reversed(logs):
        lines.append(f"Пользователь: {log.query}")
        lines.append(f"Модель: {log.response}")
    return "\n".join(lines)

@router.get('/v1/frida')
async def make_request_and_get_response_from_mistral(
    token: TokenDependency,
    session: SessionDependency,
    query: str,
    history_count: Optional[int] = Query(None, ge=0, le=3),

):
    try:
        mlv_data = await crud.get_milvus_data(query)
        user_id = token.user_id
        # Use history_count to limit logs, default to 3 if not provided
        history_logs = await crud.get_last_frida_logs(session, user_id, limit=history_count or 3)

        chat_history_str = format_frida_history(history_logs) if history_logs else "нет истории диалога"

        mistral_response = await crud.get_mistral_response(
            text=query,
            combined_context=mlv_data.combined_context,
            chat_history=chat_history_str,
            input_type="text"
        )

        await crud.log_frida_interaction(
            session=session,
            user_id=user_id,
            query=query,
            response=mistral_response,
            hashes=mlv_data.hashs,
            error=None,
        )

        return {"response": mistral_response}

    except HTTPException as e:
        logger.error(f"Mistral error: {e}")
        await crud.log_frida_interaction(
            session=session,
            user_id=token.user_id,
            query=query,
            response="",
            hashes=[],
            error=str(e),
        )
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        await crud.log_frida_interaction(
            session=session,
            user_id=token.user_id,
            query=query,
            response="",
            hashes=[],
            error=str(e),
        )
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")