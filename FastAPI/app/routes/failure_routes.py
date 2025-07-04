"""
Маршруты для работы с авариями.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.crud import find_failure_by_login, get_login_data
from app.depencies import TokenDependency, RedisDependency
from app.schemas import FailureDetail, LoginFailureData

router = APIRouter()


@router.get('/v1/failure', response_model=FailureDetail, tags=["Аварии"])
async def get_failure_by_login(
    redis: RedisDependency,
    token: TokenDependency,
    login: Optional[str] = Query(None)
) -> FailureDetail:
    """Эндпоинт для поиска аварий по логину"""
    try:
        if not login:
            raise HTTPException(status_code=400, detail='Логин не указан')

        try:
            login_data = await get_login_data(login, redis)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка получения данных из Redis: {e}") from e

        try:
            login_data = LoginFailureData(**login_data)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка обработки данных логина: {e}") from e

        try:
            failures_list = await find_failure_by_login(redis, login_data)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка поиска аварий: {e}") from e

        if failures_list is None:
            return FailureDetail(isFailure=False, failure=[])

        try:
            response = FailureDetail(
                isFailure=True,
                failure=[
                    {
                        key: datetime.fromtimestamp(value).isoformat() if key in ['modified_date', 'createdDate'] else value
                        for key, value in failure.items()
                    }
                    for failure in failures_list
                ]
            )
            return response
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка обработки данных аварий: {e}") from e

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки запроса: {e}") from e
