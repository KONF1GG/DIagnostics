"""Diagnostic API"""

import logging
import uvicorn

from app.routes.auth_routes import router as auth_router
from app.routes.default_routes import router as def_routes
from app.routes.user_routes import router as user_router
from app.routes.failure_routes import router as failure_router
from app.routes.network_routes import router as network_router
from app.routes.cameras_routes import router as cameras_router
from app.routes.TV_routes import router as TV_router
from app.routes.App_routes import router as app_router
from app.routes.payment_routes import router as pay_router
from app.routes.intercom_router import router as intercom_router
from app.routes.frida_routes import router as frida_router

from app.lifespan import lifespan

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


logging.basicConfig(level=logging.INFO)
app = FastAPI(
    title="Diagnostics API",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
    'http://192.168.0.101:5173',
    'http://192.168.0.101:3000',
    'http://192.168.111.62:3000',
    'http://192.168.111.62:5173',
    '*'
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(auth_router)
app.include_router(def_routes)
app.include_router(failure_router)
app.include_router(network_router)
app.include_router(cameras_router)
app.include_router(TV_router)
app.include_router(app_router)
app.include_router(pay_router)
app.include_router(intercom_router)
app.include_router(frida_router)

if __name__ == "__main__":
    uvicorn.run("app.main:app", port=8000, reload=True)
