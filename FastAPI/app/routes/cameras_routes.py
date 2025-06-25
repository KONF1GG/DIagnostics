"""
Маршруты для работы с камерами.
"""

import asyncio
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Query

from app.depencies import TokenDependency, RedisDependency
from app.schemas import CameraDataToChange, StatusResponse
from app.crud import (
    get_login_data,
    get_cameras,
    get_cameras_from_redis,
    fetch_services,
    get_services_from_1C,
    check_flussonic_streams,
    get_cameras_difference,
    get_services_differences,
    get_cameras_form_flussonic,
    camera_update_1c,
)

router = APIRouter()


@router.get("/v1/cameras", response_model=Dict[str, Any], tags=["Камеры"])
async def get_cameras_data(
    redis: RedisDependency, token: TokenDependency, login: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Эндпоинт для проверки камер и услуг по логину"""
    try:
        if not login:
            raise HTTPException(status_code=400, detail="Логин не указан")

        try:
            login_data_from_redis = await get_login_data(login, redis)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка получения данных из Redis: {str(e)}")

        if not login_data_from_redis:
            raise HTTPException(
                status_code=404, detail=f"Ошибка получения данных по логину - {login}"
            )

        uuid = login_data_from_redis.get("UUID")
        uuid2 = login_data_from_redis.get("UUID2")

        try:
            cameras_from_1c, cameras_from_redis, services = await asyncio.gather(
                get_cameras(login),  # Камеры из 1С
                get_cameras_from_redis(login, redis, login_data_from_redis),  # Камеры из Redis
                fetch_services(uuid or "", uuid2 or ""),  # Услуги из 1С
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка получения данных о камерах: {str(e)}")

        try:
            service_list = await get_services_from_1C(services)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка получения данных об услугах: {str(e)}")

        try:
            (
                flussonic_diffs,
                cameras_difference,
                service_differences,
                flussonic_cameras,
            ) = await asyncio.gather(
                check_flussonic_streams(
                    cameras_from_1c if cameras_from_1c else cameras_from_redis
                ),
                get_cameras_difference(cameras_from_1c, cameras_from_redis),
                get_services_differences(service_list, cameras_from_1c),
                get_cameras_form_flussonic(
                    cameras_from_1c.cameras if cameras_from_1c else cameras_from_redis
                ),
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка обработки данных о камерах: {str(e)}")

        response = {
            "services": service_list,
            "cameras_from_1c": cameras_from_1c,
            "cameras_from_redis": cameras_from_redis,
            "flus_diffs": flussonic_diffs,
            "cameras_difference": cameras_difference,
            "service_diffs": service_differences,
            "cameras_from_flussonic": flussonic_cameras,
        }

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки запроса: {str(e)}") from e


@router.post("/camera/{camera_id}", response_model=StatusResponse, tags=["Камеры"])
async def camera_update(
    camera_id: int,
    camera_data: CameraDataToChange,
    token: TokenDependency,
):
    """Эндпоинт для обновления данных камеры"""
    try:
        response_data = await camera_update_1c(camera_id, camera_data)
        if isinstance(response_data, dict):
            if response_data["status"] == 1:
                return StatusResponse(status="success")
            else:
                return StatusResponse(status="error")
        else:
            raise HTTPException(status_code=500, detail="Некорректный ответ от сервиса обновления камеры")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обновления данных камеры: {str(e)}") from e
