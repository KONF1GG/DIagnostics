"""
Маршруты для работы с пользователями.

Эндпоинты:
- Получение списка пользователей.
- Создание, обновление, удаление пользователя.
- Получение данных конкретного пользователя.
"""

import logging
from typing import List

from fastapi import APIRouter, HTTPException

from app.auth import hash_password
from app.crud import add_item, get_item
from app.depencies import SessionDependency, TokenDependency
from app.schemas import (
    ItemId,
    CreateUser,
    ResponseUserData,
    UpdateUser,
    StatusResponse,
    UserModel,
)
from sqlalchemy.orm import selectinload
from app.models import User, Token
from sqlalchemy import delete, select

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/v1/users", response_model=List[UserModel], tags=["Пользователи"])
async def get_users(session: SessionDependency, token: TokenDependency):  # type: ignore
    """Эндпоинт для получения списка пользователей"""
    query = select(User).options(selectinload(User.role))
    result = await session.execute(query)
    users = result.scalars().unique().all()

    user_data = []
    for user in users:
        user_data.append(UserModel(id=user.id, username=user.username, role=user.role.name, firstname=user.firstname, lastname=user.lastname, middlename=user.middlename))

    return user_data  

@router.post('/v1/user', response_model=ItemId, tags=["Пользователи"])
async def create_user(
        user_data: CreateUser,
        session: SessionDependency,  # type: ignore
        token: TokenDependency
):
    """Эндпоинт для создания нового пользователя"""
    current_user_id = token.user_id
    current_user = await get_item(session, User, current_user_id)
    if current_user.role_id == 1:  # type: ignore
        user = User(**user_data.dict())
    else:
        user_data.role_id = 2

    user = User(**user_data.dict())
    user.password = await hash_password(user_data.password)
    user = await add_item(session, user)
    return {'id': user.id}

@router.get('/v1/user/{user_id}', response_model=ResponseUserData, tags=["Пользователи"])
async def get_user(
    user_id: int,
    session: SessionDependency,  # type: ignore
    token: TokenDependency
):
    """Эндпоинт для получения данных пользователя"""
    current_user_id = token.user_id
    current_user = await get_item(session, User, current_user_id)
    user = await get_item(session, User, user_id)
    isItself = token.user_id == user_id

    return ResponseUserData(id=user.id,
                            username=user.username,  # type: ignore
                            role=user.role.name,  # type: ignore
                            isItself=isItself,  # type: ignore
                            firstname=user.firstname,  # type: ignore
                            lastname=user.lastname,  # type: ignore
                            middlename=user.middlename,  # type: ignore
                            current_user_role=current_user.role.name)  # type: ignore

@router.patch('/v1/user/{user_id}', response_model=ItemId, tags=["Пользователи"])
async def update_user(
        user_data: UpdateUser,
        user_id: int,
        session: SessionDependency,  # type: ignore
        token: TokenDependency
):
    """Эндпоинт для обновления пользователя"""
    user_orm = await get_item(session, User, user_id)
    current_user_id = token.user_id
    current_user = await get_item(session, User, current_user_id)

    if current_user.role_id == 1:  # type: ignore
        # если текущий пользователь - администратор, он может обновлять любую роль
        for field, value in user_data.dict(exclude_unset=True).items():
            setattr(user_orm, field, value)
    else:  # любая другая роль
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to update this user")

        for field, value in user_data.dict(exclude_unset=True).items():
            if field == 'role_id':
                continue  # обычный пользователь не может изменять свою роль
            setattr(user_orm, field, value)

    if user_data.password:
        user_orm.password = await hash_password(user_orm.password)  # type: ignore
    user_orm = await add_item(session, user_orm)

    return {'id': user_orm.id}

@router.delete('/v1/user/{user_id}', response_model=StatusResponse, tags=["Пользователи"])
async def delete_user(user_id: int, session: SessionDependency, token: TokenDependency):  # type: ignore
    """Эндпоинт для удаления пользователя"""
    try:
        current_user_id = token.user_id
        current_user = await get_item(session, User, current_user_id)
        if current_user.role_id == 1 or token.user_id == user_id:  # type: ignore
            try:
                user = await get_item(session, User, user_id)
                await session.execute(
                    delete(Token).where(Token.user_id == user.id)
                )
                await session.execute(
                    delete(User).where(User.id == user.id)
                )
                await session.commit()
                return {'status': 'deleted'}
            except Exception as e:
                logger.error("Ошибка при удалении пользователя %s: %s", user_id, str(e))
                raise HTTPException(status_code=500, detail="Ошибка при удалении пользователя") from e
        else:
            raise HTTPException(status_code=403, detail="Только администратор может удалить другого пользователя!")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Внутренняя ошибка при удалении пользователя %s: %s", user_id, str(e))
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера") from e

