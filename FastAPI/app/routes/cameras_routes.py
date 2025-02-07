from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from depencies import TokenDependency, RedisDependency
import asyncio
import crud
from typing import Dict, Any, Optional
from schemas import CameraDataToChange, StatusResponse

router = APIRouter()


@router.get('/v1/cameras', response_model=Dict[str, Any])
async def get_cameras_data(
        redis: RedisDependency,
        token: TokenDependency,
        login: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Эндпоинт для проверки камер и услуг по логину"""

    if not login:
        raise HTTPException(status_code=400, detail='Логин не указан')

    login_data_from_redis = await crud.get_login_data(login, redis)

    if not login_data_from_redis:
        raise HTTPException(status_code=404, detail=f'Ошибка получения данных по логину - {login}')

    uuid = login_data_from_redis.get('UUID')
    uuid2 = login_data_from_redis.get('UUID2')


    cameras_from_1c, cameras_from_redis, services = await asyncio.gather(
        crud.get_cameras(login),  # Камеры из 1С
        crud.get_cameras_from_redis(login, redis, login_data_from_redis),  # Камеры из Redis
        crud.fetch_services(uuid, uuid2)  # Услуги из 1С
    )

    service_list = await crud.get_services_from_1C(services)


    flussonic_diffs, cameras_difference, service_differences, flussonic_cameras = await asyncio.gather(
        crud.check_flussonic_streams(cameras_from_1c if cameras_from_1c else cameras_from_redis),
        crud.get_cameras_difference(cameras_from_1c, cameras_from_redis),
        crud.get_services_differences(service_list, cameras_from_1c),
        crud.get_cameras_form_flussonic(cameras_from_1c.cameras if cameras_from_1c else cameras_from_redis)
    )

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


@router.post('/camera/{camera_id}', response_model=StatusResponse)
async def camera_update(
        camera_id: int,
        camera_data: CameraDataToChange,
        token: TokenDependency,):
    """Эндпоинт для обновления данных камеры"""

    response_data = await crud.camera_update_1c(camera_id, camera_data)
    if isinstance(response_data, dict):
        if response_data['status'] == 1:
            return StatusResponse(status='success')
        else:
            return StatusResponse(status='error')
