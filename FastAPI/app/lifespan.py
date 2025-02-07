from contextlib import asynccontextmanager
from models import Base, engine
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    print('START')
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    print('STOP')
