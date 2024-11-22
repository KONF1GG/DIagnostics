from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app import crud
from app.crud import find_failure_by_login, get_login_data
from app.depencies import TokenDependency, RedisDependency
from app.schemas import FailureDetail, LoginFailureData
from datetime import datetime
import app.crud

router = APIRouter()

from fastapi import HTTPException

@router.get('/v1/failure', response_model=FailureDetail)
async def get_failure_by_login(
        redis: RedisDependency,
        token: TokenDependency,
        login: Optional[str] = Query(None)
) -> FailureDetail:
    """Эндпоинт для поиска аварий по логину"""

    # Проверка наличия логина
    if not login:
        raise HTTPException(status_code=400, detail='Логин не указан')

    # Получаем данные по логину
    login_data = await get_login_data(login, redis)

    try:
        login_data = LoginFailureData(**login_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки данных логина: {e}")

    # Находим аварии по логину
    failures_list = await crud.find_failure_by_login(redis, login_data)
    # Формируем ответ
    if failures_list:
        response = {
            'isFailure': True,
            'failure': []
        }

        if isinstance(failures_list, list):
            for failure in failures_list:
                formatted_failure = {}
                for key, value in failure.items():
                    if key in ['modified_date', 'createdDate']:
                        formatted_failure[key] = datetime.fromtimestamp(value).isoformat()
                    else:
                        formatted_failure[key] = value
                response['failure'].append(formatted_failure)
        else:
            formatted_failure = {}
            for key, value in failures_list.items():
                if key in ['modified_date', 'createdDate']:
                    formatted_failure[key] = datetime.fromtimestamp(value).isoformat()
                else:
                    formatted_failure[key] = value
            response['failure'].append(formatted_failure)
        return response

    return {'isFailure': False, 'failure': []}
