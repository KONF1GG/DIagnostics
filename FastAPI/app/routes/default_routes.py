import asyncio
import json
from os import access
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import JSON, Boolean

from app import crud
from app.depencies import SessionDependency, TokenDependency, RedisDependency, ClickhouseDepency
from app.schemas import Action, ItemId, CreateRole, LogData, RedisLoginSearch, SearchLogins, StatusResponse
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
    print(result)
    return {'logins': result}

@router.post('/v1/log', response_model=StatusResponse)
async def log(
    session: SessionDependency,
    clickhouse: ClickhouseDepency,
    token: TokenDependency, 
    data: LogData):

    current_user_id = token.user_id
    current_user = await crud.get_item(session, User, current_user_id)
    
    user_name = current_user.username
    login = data.login
    page = data.page
    action = data.action
    success = data.success
    message = data.message
    url = data.url
    payload = data.payload
    user_id = token.user_id


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
            payload=payload,
            user_id=user_id
        )
    except Exception as e:
        return {"status": "error", "message": f"Ошибка при логировании в ClickHouse: {e}"}

    # Возвращаем успешный статус
    return {"status": "success"}

async def export_schema(redis):
    schema = await crud.get_schema_from_redis(redis)

    file_path = "../React/Diagnostics-app/src/components/FileData/diagnosticHelper.json"
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(schema, file, indent=4, ensure_ascii=False)

    return True

@router.get('/v1/redis_data', response_model=Dict)
async def get_data_from_redis_by_login(login: str, redis: RedisDependency, token: TokenDependency):
    await export_schema(redis)
    return await crud.get_login_data(login, redis)


@router.get('/v1/last_actioins', response_model=List[Action])
async def get_last_actions(clickhouse: ClickhouseDepency, token: TokenDependency):
    last_actions = await crud.get_last_actions(clickhouse)
    return last_actions