import asyncio
import json
import time
from operator import add
from xml.dom.expatbuilder import theDOMImplementation
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Optional

from redis import ResponseError
from app import crud
from app.depencies import RedisDependency, SessionRediusDependency, TokenDependency, RBTDependency
from app.schemas import TV24, TVIP, AppResponse, ChangeRoleRequest, LoginsData, Phone, RBT_phone, RedisLogin, Service1C, Service1c, ServiceOp, Smotreshka, StatusResponse, TVResponse
from app import config

router = APIRouter()

@router.get('/v1/app', response_model=AppResponse | Dict)
async def get_connection_data(
    token: TokenDependency,
    redis: RedisDependency,
    rbt: RBTDependency,
    login: Optional[str] = Query(None)
):
    """Эндпоинт для получения информации приложения"""

    # Текущая временная метка
    current_datetime = time.time()

    # Количество секунд в 3 месяцах 
    three_months_in_seconds = 30.44 * 24 * 60 * 60 * 3
    redis_data = await crud.get_redis_key_data(login, redis)
    flat_id = redis_data.get("flatId", 0)

    if flat_id == 0:
        raise HTTPException(
            status_code=404,
            detail="Договор не зарегистрирован в приложении"
        )

    # Получение адреса из данных Redis
    address_in_the_app = redis_data.get("address", "Неизвестно")

    # Получение списка логинов
    logins_list = await crud.get_logins_by_flatId_redis(flat_id, redis)
    contracts = []
    for doc in logins_list:
        data = json.loads(doc.json)
        flat = data.get('flat')
        flatId = data.get('flatId')
        flat_from_RBT = await crud.get_flat_from_RBT_by_flatId(flatId, rbt)
        flat_value = bool(flat) 
        flat_from_RBT_value = bool(flat_from_RBT[0]['flat']) if flat_from_RBT[0]['flat'] is not None else False

        house_flat_subscribers = await crud.get_houses_flats_subscribers_by_flat_id(flatId, rbt)
        is_relocatable = (flat_value != flat_from_RBT_value) or house_flat_subscribers == 0

        contracts.append(LoginsData(
            phone=data.get('primePhone', ''),
            login=data.get('login', ''),
            name=data.get('name', 'Неизвестно'),
            address=data.get('address', 'Неизвестно'),
            contract=data.get('contract', 'Неизвестно'),
            active=True if 0 > max(data.get('servicecats', {}).get('internet', {}).get('timeto', 0), 
                               data.get('servicecats', {}).get('intercomhandset', {}).get('timeto', 0), 
                               data.get('servicecats', {}).get('intercom', {}). get('timeto', 0)) - current_datetime < three_months_in_seconds else False, 
            relocate=is_relocatable,  # Добавляем логику для кнопки "Переселить"
            UUID2=data.get('UUID2', '')
        ))

    # Получение данных о номерах RBT
    rbt_phones = await crud.get_numbers_rbt(flat_id, rbt)
    phones = []
    for rbt_phone in rbt_phones:
        flats = await crud.get_flats(rbt_phone.house_id, rbt)
        redis_logins = await crud.get_logins_from_redis(flats, redis)
        redis_contracts = [
            RedisLogin(
                login=data.get('login', ''),
                address=data.get('address', 'Неизвестно'),
                contract=data.get('contract', 'Неизвестно')
            )
            for login in redis_logins
            for data in [json.loads(login.json)]
        ]

        phones.append(Phone(**rbt_phone.dict(), contracts=redis_contracts))

    return AppResponse(
        address_in_app=address_in_the_app,
        contracts=contracts,
        phones=phones
    )

@router.patch('/v1/app/change_role', response_model=StatusResponse)
async def change_role_in_RBT(
    request: ChangeRoleRequest,  # Получаем все параметры из тела запроса
    rbt: RBTDependency  # Замените тип на конкретный тип зависимости, если требуется
):
    print(f"Changing role: house_id={request.house_id}, flat_id={request.flat_id}, role={request.role}")

    # Используем транзакцию для работы с базой данных
    # async with rbt.transaction():
    #     try:
    #         # Выполняем SQL-запрос для обновления роли
    #         result = await rbt.execute("""
    #             UPDATE houses_flats_subscribers
    #             SET role = :role
    #             WHERE house_id = :house_id AND flat_id = :flat_id
    #         """, {
    #             "role": request.role,
    #             "house_id": request.house_id,
    #             "flat_id": request.flat_id
    #         })

    #         if result.rowcount == 0:
    #             # Если обновление не затронуло ни одной строки, возвращаем ошибку
    #             raise HTTPException(
    #                 status_code=404,
    #                 detail="Запись с указанными house_id и flat_id не найдена"
    #             )

    #         # Успешный результат
    #         return StatusResponse(
    #             status="success",
    #         )

    #     except Exception as e:
    #         # Логирование и обработка ошибки
    #         raise HTTPException(
    #             status_code=500,
    #             detail=f"Ошибка изменения роли: {str(e)}"
    #         )

@router.delete('/v1/app/houses_flats_subscribers/{house_id}', response_model=StatusResponse)
async def delete_user_from_houses_flats_subscribers_RBT(house_id: int, rbt: RBTDependency):
    return StatusResponse(
                status="success",
            )
    # async with rbt.transaction():
    #     try:
    #         # Удаляем запись из основной таблицы
    #         result = await rbt.execute("""
    #             DELETE FROM houses_flats_subscribers
    #             WHERE house_subscriber_id = :house_id
    #         """, {"house_id": house_id})

    #         # Проверяем, что запись была найдена и удалена
    #         if result.rowcount == 0:
    #             raise HTTPException(
    #                 status_code=404,
    #                 detail=f"Запись с ID {house_id} не найдена"
    #             )

    #         # Успешный результат
    #         return StatusResponse(
    #             status="success",
    #             message=f"Запись с ID {house_id} удалена"
    #         )

    #     except Exception as e:
    #         # Логирование ошибки (рекомендуется добавить, если есть логирование в проекте)
    #         raise HTTPException(
    #             status_code=500,
    #             detail=f"Ошибка удаления записи с ID {house_id}: {str(e)}"
    #         )
