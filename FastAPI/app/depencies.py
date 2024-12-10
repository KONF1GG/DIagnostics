import uuid
import datetime
import clickhouse_connect
import asyncpg
from redis.asyncio import Redis, from_url
from app.models import Session, Token, SessionRedius
from typing import Annotated, Optional
from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
import redis.asyncio as aioredis
import psycopg2
from app import config


async def get_session():
    async with Session() as session:
        yield session


SessionDependency = Annotated[Session, Depends(get_session, use_cache=True)]


async def get_session_redius():
    async with SessionRedius() as session_redius:
        yield session_redius

SessionRediusDependency = Annotated[Session, Depends(get_session_redius)]


async def get_token(session: SessionDependency, x_token: Optional[str] = Header(None)) -> Token:
    if x_token is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    token_query = select(Token).where(
        Token.token == x_token,
        Token.creation_time >= datetime.datetime.now() - datetime.timedelta(seconds=int(config.TOKEN_TTL))
    )
    token = await session.scalar(token_query)
    if token is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    else:
        return token


TokenDependency = Annotated[Token, Depends(get_token)]


async def get_redis_connection() -> Redis:
    connection = await from_url(f"redis://{config.REDIS_HOST}:{config.REDIS_PORT}", password=config.REDIS_PASSWORD)
    try:
        yield connection
    finally:
        await connection.aclose()

RedisDependency = Annotated[aioredis.Redis, Depends(get_redis_connection)]

async def get_rbt_connection() -> asyncpg.connect:
    connection = await asyncpg.connect(
        host=config.POSTGRES_HOST,
        port=config.POSTGRES_PORT,
        database=config.POSTGRES_DATABASE,
        user=config.POSTGRES_USER,
        password=config.POSTGRES_PASSWORD,
    )
    try:
        yield connection
    finally:
        await connection.close()

RBTDependency = Annotated[psycopg2.connect, Depends(get_rbt_connection)]


async def get_clickhouse_connections():

    clickhouse_client = clickhouse_connect.get_client(
        host=config.CLICKHOUSE_HOST,
        username=config.CLICKHOUSE_USER,
        password=config.CLICKHOUSE_PASSWORD
    )

    try:
        yield clickhouse_client
    finally:
        clickhouse_client.close()




ClickhouseDepency = Annotated[clickhouse_connect, Depends(get_clickhouse_connections)]