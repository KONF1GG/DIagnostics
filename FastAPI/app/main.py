import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth_routes import router as auth_router
from routes.default_routes import router as def_routes
from routes.user_routes import router as user_router
from routes.failure_routes import router as failure_router
from routes.network_routes import router as network_router
from routes.cameras_routes import router as cameras_router
from routes.TV_routes import router as TV_router
from routes.App_routes import router as app_router

from lifespan import lifespan


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


# if __name__ == "__main__":
#     uvicorn.run(app, port=8000)
