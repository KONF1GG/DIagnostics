"""
Маршруты для аутентификации пользователей.
"""

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.auth import verify_password, hash_password
from app.crud import add_item
from app.depencies import SessionDependency, TokenDependency
from app.schemas import CreateUser, Login, LoginResponse, StatusResponse
from app.models import User, Token

router = APIRouter()


@router.post('/v1/login', response_model=LoginResponse, tags=["Авторизация"])
async def login_user_v1(login_data: Login, session: SessionDependency):  # type: ignore
    """Эндпоинт для логина пользователя."""
    try:
        user_query = select(User).where(User.username == login_data.username)
        user_model = await session.scalar(user_query)
        if user_model is None:
            raise HTTPException(status_code=401, detail="Неверное имя или пароль")

        if not await verify_password(login_data.password, user_model.password):
            raise HTTPException(status_code=401, detail="Неверное имя или пароль")

        token = Token(user_id=user_model.id)
        token = await add_item(session, token)
        return {'token': token.token}  # type: ignore
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при логине: {str(e)}") from e


@router.post('/v1/token', response_model=StatusResponse, tags=["Авторизация"])
async def login_user(token: TokenDependency):
    """Эндпоинт для проверки токена."""
    try:
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка проверки токена: {str(e)}") from e


@router.post('/v1/reg', response_model=StatusResponse, tags=["Авторизация"])
async def create_user(user_data: CreateUser, session: SessionDependency):  # type: ignore
    """Эндпоинт для регистрации пользователя."""
    try:
        user_data.role_id = 2
        user_data.firstname, user_data.lastname, user_data.middlename = map(
            str.capitalize,
            [user_data.firstname, user_data.lastname, user_data.middlename]
        )

        user = User(**user_data.dict())
        user.password = await hash_password(user_data.password)
        user = await add_item(session, user)
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при регистрации пользователя: {str(e)}") from e
