import asyncio
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Optional

from redis import ResponseError
from app import crud
from app.depencies import RedisDependency, SessionRediusDependency, TokenDependency
from app.schemas import TV24, TVIP, Service1C, Service1c, ServiceOp, Smotreshka, TVResponse
from app import config

router = APIRouter()

@router.get('/v1/app', response_model=Dict)
async def get_connection_data(
    token: TokenDependency,
    login: Optional[str] = Query(None)
):
    """Эндпоинт для получения информации приложения"""
    response_data = {
        ''
    }
    return response_data
    