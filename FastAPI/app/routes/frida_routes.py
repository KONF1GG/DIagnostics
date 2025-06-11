import asyncio
import aiohttp
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
import logging

# Настройка логирования
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get('/v1/frida')
async def get_data_for_intercom_page(
    login: Optional[str] = Query(None),
):
    """Эндпоинт Фриды"""
    

    return ...