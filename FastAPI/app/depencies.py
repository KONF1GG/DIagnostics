"""
Зависимости для FastAPI.
"""
from typing import Annotated, Any, Optional, AsyncGenerator

import datetime
import clickhouse_connect
import asyncpg
from redis.asyncio import Redis, from_url
from sqlalchemy import select
from fastapi import Depends, Header, HTTPException

from app.models import Session, Token, SessionRadius
from app.config import (
    TOKEN_TTL, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD,
    POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DATABASE, POSTGRES_USER, POSTGRES_PASSWORD,
    CLICKHOUSE_HOST, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD
)


async def get_session():
    """Получение сессии SQLAlchemy."""
    async with Session() as session:
        yield session


SessionDependency = Annotated[Session, Depends(get_session, use_cache=True)]


async def get_session_redius():
    """Получение сессии для радиус-базы."""
    async with SessionRadius() as session_redius:
        yield session_redius


SessionRediusDependency = Annotated[Session, Depends(get_session_redius)]


async def get_token(session: SessionDependency, x_token: Optional[str] = Header(None)) -> Token: # type: ignore
    """Получение токена из заголовка."""
    if x_token is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    token_query = select(Token).where(
        Token.token == x_token,
        Token.creation_time >= datetime.datetime.now() - datetime.timedelta(seconds=int(TOKEN_TTL))
    )
    token = await session.scalar(token_query)
    if token is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    else:
        return token


TokenDependency = Annotated[Token, Depends(get_token)]


async def get_redis_connection() -> AsyncGenerator[Redis, None]:
    """Получение подключения к Redis."""
    connection = await from_url(f"redis://{REDIS_HOST}:{REDIS_PORT}", password=REDIS_PASSWORD)
    try:
        yield connection
    finally:
        await connection.aclose()


RedisDependency = Annotated[Any, Depends(get_redis_connection)]



async def get_rbt_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    """Получение подключения к PostgreSQL."""
    connection = await asyncpg.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DATABASE,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
    )
    try:
        yield connection
    finally:
        await connection.close()


RBTDependency = Annotated[Any, Depends(get_rbt_connection)]


async def get_clickhouse_connections():
    """Получение подключения к ClickHouse."""
    clickhouse_client = clickhouse_connect.get_client(
        host=CLICKHOUSE_HOST or "localhost",
        username=CLICKHOUSE_USER or 'default',
        password=CLICKHOUSE_PASSWORD or ''
    )
    try:
        yield clickhouse_client
    finally:
        clickhouse_client.close()


ClickhouseDependency = Annotated[Any, Depends(get_clickhouse_connections)]
