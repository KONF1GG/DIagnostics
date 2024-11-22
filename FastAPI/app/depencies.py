import uuid
import datetime

from redis.asyncio import Redis, from_url

from app.config import TOKEN_TTL, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT
from app.models import Session, Token, SessionRedius
from typing import Annotated, Optional
from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
import redis.asyncio as aioredis


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
        Token.creation_time >= datetime.datetime.now() - datetime.timedelta(seconds=int(TOKEN_TTL))
    )
    token = await session.scalar(token_query)
    if token is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    else:
        return token


TokenDependency = Annotated[Token, Depends(get_token)]


async def get_redis_connection() -> Redis:
    connection = await from_url(f"redis://{REDIS_HOST}:{REDIS_PORT}", password=REDIS_PASSWORD)
    try:
        yield connection
    finally:
        await connection.aclose()

RedisDependency = Annotated[aioredis.Redis, Depends(get_redis_connection)]
