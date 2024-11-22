import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth_routes import router as auth_router
from app.routes.role_routes import router as role_router
from app.routes.user_routes import router as user_router
from app.routes.failure_routes import router as failure_router
from app.routes.network_routes import router as network_router
from app.routes.cameras_routes import router as cameras_router
from app.routes.TV_routes import router as TV_router

from app.lifespan import lifespan


app = FastAPI(
    title="Diagnostics API",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
    'http://192.168.0.101:5173',
    'http://192.168.0.101:3000'
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
app.include_router(role_router)
app.include_router(failure_router)
app.include_router(network_router)
app.include_router(cameras_router)
app.include_router(TV_router)


# if __name__ == "__main__":
#     uvicorn.run(app, port=8000)
