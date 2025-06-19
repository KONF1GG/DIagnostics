from typing import Optional
from fastapi import APIRouter, HTTPException, Query
import logging

from depencies import SessionDependency, TokenDependency
import crud

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get('/v1/frida')
async def get_data_for_intercom_page(
    query: str,
    token: TokenDependency,
    session: SessionDependency,
):
    mlv_data = await crud.get_milvus_data(query)
    user_id = token.user_id
    history = await crud.get_last_frida_logs(session, user_id)

    try:
        mistral_response = await crud.get_mistral_response(
            text=query,
            combined_context=mlv_data.combined_context,
            chat_history='str(history)', 
            input_type="text"
        )
        return {"response": mistral_response}
    except HTTPException as e:
        logger.error(f"Mistral error: {e.detail}")
        raise