from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends

from app import crud, auth
from app.depencies import SessionDependency, get_token, TokenDependency
from app.schemas import ItemId, CreateUser, UpdateUser, StatusResponse, UserModel
from sqlalchemy.orm import selectinload
from app.models import User, Token
from sqlalchemy import delete, select

router = APIRouter()

@router.get("/v1/users", response_model=List[UserModel]) 
async def get_users(session: SessionDependency, token: TokenDependency):
    """Эндпоинт для получения списка пользователей"""
    query = select(User).options(selectinload(User.role))
    result = await session.execute(query)
    users = result.scalars().unique().all()

    user_data = []
    for user in users:
        user_data.append(UserModel(id=user.id, name=user.name, role=user.role.name))

    return user_data  

@router.post('/v1/user', response_model=ItemId)
async def create_user(
        user_data: CreateUser,
        session: SessionDependency,
        token: TokenDependency
):

    """Эндпоинт для создания нового пользователя"""

    if token:
        current_user_id = token.user_id
        current_user = await crud.get_item(session, User, current_user_id)
        if current_user.role_id == 1:
            user = User(**user_data.dict())
        else:
            user_data.role_id = 2
    else:
        user_data.role_id = 2

    user = User(**user_data.dict())
    user.password = await auth.hash_password(user_data.password)
    user = await crud.add_item(session, user)
    return {'id': user.id}


@router.patch('/v1/user/{user_id}', response_model=ItemId)
async def update_user(
        user_data: UpdateUser,
        user_id: int,
        session: SessionDependency,
        token: TokenDependency
):

    """Эндпоинт для обновления пользователя"""

    user_orm = await crud.get_item(session, User, user_id)
    current_user_id = token.user_id
    current_user = await crud.get_item(session, User, current_user_id)

    if current_user.role_id == 1:  # роль: администратор
        for field, value in user_data.dict(exclude_unset=True).items():
            # Проверка, пытается ли администратор изменить роль другого администратора
            if field == 'role_id' and user_orm.role_id == 1 and user_id != current_user_id:
                raise HTTPException(status_code=403, detail="You cannot change the role of another admin")
            setattr(user_orm, field, value)
    else:  # любая другая роль
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="You are not authorized to update this user")

        for field, value in user_data.dict(exclude_unset=True).items():
            if field == 'role_id':
                continue  # обычный пользователь не может изменять свою роль
            setattr(user_orm, field, value)

    user_orm.password = await auth.hash_password(user_orm.password)
    user_orm = await crud.add_item(session, user_orm)

    return {'id': user_orm.id}


@router.delete('/v1/user/{user_id}', response_model=StatusResponse)
async def delete_user(user_id: int, session: SessionDependency, token: TokenDependency):

    """Эндпоинт для удаления пользователя"""

    current_user_id = token.user_id
    current_user = await crud.get_item(session, User, current_user_id)
    if current_user.role_id == 1:
        user = await crud.get_item(session, User, user_id)
        await session.execute(
            delete(Token).where(Token.user_id == user.id)
        )

        await session.execute(
            delete(User).where(User.id == user.id)
        )
        await session.commit()
        return {'status': 'deleted'}
    else:
        raise HTTPException(status_code=403, detail="You are not authorized to delete this user")

