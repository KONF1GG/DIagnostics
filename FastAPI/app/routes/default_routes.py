from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.crud import (
    add_item,
    get_item,
    get_login_data,
    get_schema_from_redis,
    get_last_actions_from_clickhouse,
    log_to_clickhouse,
    search_logins,
)
from app.depencies import (
    SessionDependency,
    TokenDependency,
    RedisDependency,
    ClickhouseDependency,
)
from app.schemas import (
    Action,
    ItemId,
    CreateRole,
    LogData,
    SearchLogins,
    StatusResponse,
)
from app.models import User, Role

router = APIRouter()


@router.post('/v1/role', response_model=ItemId, tags=["Общие"])
async def create_role(role_data: CreateRole, session: SessionDependency, token: TokenDependency):  # type: ignore
    """Эндпоинт для создания новой роли"""
    try:
        current_user_id = token.user_id
        current_user = await get_item(session, User, current_user_id)
        if current_user.role_id != 1:  # type: ignore
            raise HTTPException(status_code=403, detail="Only admins can create roles")
        
        role = Role(**role_data.dict())
        role = await add_item(session, role)
        return {'id': role.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания роли: {str(e)}") from e


@router.get('/v1/search_logins', response_model=SearchLogins, tags=["Общие"])
async def get_search_logins(
    redis: RedisDependency,
    token: TokenDependency, 
    login: Optional[str] = Query(None)
):
    try:
        result = await search_logins(login or "", redis)
        return {'logins': result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка поиска логинов: {str(e)}") from e


@router.post('/v1/log', response_model=StatusResponse, tags=["Общие"])
async def log(
    session: SessionDependency, # type: ignore
    clickhouse: ClickhouseDependency,
    token: TokenDependency, 
    data: LogData):
    """Эндпоинт для логирования данных в ClickHouse"""
    try:
        current_user_id = token.user_id
        current_user = await get_item(session, User, current_user_id)
        
        user_name = current_user.username # type: ignore
        login = data.login
        page = data.page
        action = data.action
        success = data.success
        message = data.message
        url = data.url
        payload = data.payload
        user_id = token.user_id

        try:
            log_to_clickhouse(
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
            raise HTTPException(status_code=500, detail=f"Ошибка при логировании в ClickHouse: {e}") from e

        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки данных для логирования: {str(e)}") from e


@router.get('/v1/redis_data', response_model=Dict, tags=["Общие"])
async def get_data_from_redis_by_login(login: str, redis: RedisDependency, token: TokenDependency):
    """Эндпоинт для получения данных из Redis по логину"""
    try:
        return await get_login_data(login, redis)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения данных из Redis: {str(e)}") from e
    

@router.get('/v1/schema', response_model=List[Dict], tags=["Общие"])
async def get_setions_schema(redis: RedisDependency):
    """Эндпоинт для получения схемы из Redis"""
    try:
        schema = await get_schema_from_redis(redis)
        return schema
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения схемы: {str(e)}") from e


@router.get('/v1/last_actioins', response_model=List[Action], tags=["Общие"])
async def get_last_actions(clickhouse: ClickhouseDependency, token: TokenDependency):
    """Эндпоинт для получения последних действий из ClickHouse"""
    try:
        last_actions = await get_last_actions_from_clickhouse(clickhouse)
        return last_actions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения последних действий: {str(e)}") from e