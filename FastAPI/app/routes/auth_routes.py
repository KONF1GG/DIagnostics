from fastapi import APIRouter, Depends, HTTPException
from .. import auth, crud
from app.depencies import SessionDependency, TokenDependency
from app.schemas import CreateUser, ItemId, Login, LoginResponse, Reg, StatusResponse
from app.models import User, Token
from sqlalchemy import select

router = APIRouter()


@router.post('/v1/login', response_model=LoginResponse)
async def login_user(login_data: Login, session: SessionDependency):

    """Эндпоинт для логина пользователя"""

    user_query = select(User).where(User.username == login_data.username)
    print(str(user_query.compile(compile_kwargs={"literal_binds": True})))
    user_model = await session.scalar(user_query)
    if user_model is None:
        raise HTTPException(status_code=401, detail="Неверное имя или пароль")

    if not await auth.verify_password(login_data.password, user_model.password):
        raise HTTPException(status_code=401, detail="Неверное имя или пароль")

    token = Token(user_id=user_model.id)
    token = await crud.add_item(session, token)
    return {'token': token.token}

@router.post('/v1/token', response_model=StatusResponse)
async def login_user(token: TokenDependency):
    return {'status': 'success'}


@router.post('/v1/reg', response_model=StatusResponse)
async def create_user(
        user_data: CreateUser,
        session: SessionDependency,
):
    """Эндпоинт для регистрации"""
    user_data.role_id = 2
    user = User(**user_data.dict())
    user.password = await auth.hash_password(user_data.password)
    user = await crud.add_item(session, user)
    return {'status': 'success'}