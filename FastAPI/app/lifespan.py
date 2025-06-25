"""
Управление жизненным циклом приложения.
"""
import logging
from contextlib import asynccontextmanager
from app.models import Base, engine
from fastapi import FastAPI

logger = logging.getLogger(__name__)
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info('START')
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    logger.info('STOP')
