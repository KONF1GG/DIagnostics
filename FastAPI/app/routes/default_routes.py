import asyncio
from os import access
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from app import crud
from app.depencies import SessionDependency, TokenDependency, RedisDependency, ClickhouseDepency
from app.schemas import ItemId, CreateRole, LogData, RedisLoginSearch, SearchLogins, StatusResponse
from app.models import User, Role

router = APIRouter()


@router.post('/v1/role', response_model=ItemId)
async def create_role(role_data: CreateRole, session: SessionDependency, token: TokenDependency):

    """Эндпоинт для создания новой роли"""

    current_user_id = token.user_id
    current_user = await crud.get_item(session, User, current_user_id)
    if current_user.role_id != 1:  # role: admin
        raise HTTPException(status_code=403, detail="Only admins can create roles")
    else:
        role = Role(**role_data.dict())
        role = await crud.add_item(session, role)
        return {'id': role.id}



@router.get('/v1/search_logins', response_model=SearchLogins)
async def get_search_logins(
    redis: RedisDependency,
    token: TokenDependency, 
    login: Optional[str] = Query(None)
):
    result = await crud.search_logins(login, redis)
    # results = await asyncio.gather(
    #     crud.search_logins(login.lower(), redis),
    #     crud.search_logins(login.capitalize(), redis)
    # )
    
    
    # result = []
    # unique_logins = []

    # for _ in results:
    #     for login in _:
    #         if login.login not in unique_logins:
    #             result.append(login)
    #             unique_logins.append(login.login)
    return {'logins': result}

@router.post('/v1/log', response_model=StatusResponse)
async def log(
    session: SessionDependency,
    clickhouse: ClickhouseDepency,
    token: TokenDependency, 
    data: LogData):

    current_user_id = token.user_id
    current_user = await crud.get_item(session, User, current_user_id)
    
    user_name = current_user.name
    login = data.login
    page = data.page
    action = data.action
    success = data.success
    message = data.message
    url = data.url
    payload = data.payload


    # Логируем данные в ClickHouse
    try:
        crud.log_to_clickhouse(
            clickhouse,
            user_name=user_name,
            login=login,
            page=page,
            action=action,
            success=success,
            message=message,
            url=url,
            payload=payload
        )
    except Exception as e:
        return {"status": "error", "message": f"Ошибка при логировании в ClickHouse: {e}"}

    # Возвращаем успешный статус
    return {"status": "success"}