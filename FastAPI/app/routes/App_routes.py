import json
import time
from fastapi import APIRouter, HTTPException, Query
from typing import Dict,  Optional
import crud
from depencies import RedisDependency, TokenDependency, RBTDependency
from schemas import AppResponse, ChangeRoleRequest, LoginsData, Phone, RedisLogin, RelocateRequest, StatusResponse


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
    main_contract = redis_data.get("contract", '')

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
        if flat == None or flat == 0:
            flat = '1'
        flatId = data.get('flatId')
        flat_from_RBT = await crud.get_flat_from_RBT_by_flatId(flatId, rbt)
        flat_from_RBT_value = flat_from_RBT[0]['flat'] if flat_from_RBT[0]['flat'] is not None else False

        house_flat_subscribers = await crud.get_houses_flats_subscribers_by_flat_id(flatId, rbt)
        is_relocatable = str(flat) if (str(flat) != flat_from_RBT_value) or house_flat_subscribers == 0 else None

        contracts.append(LoginsData(
            phone=data.get('primePhone', ''),
            login=data.get('login', ''),
            flat_id=flat_id,
            flat=str(data.get('flat', '')),
            address_house_id=data.get('houseId', ''),
            name=data.get('name', 'Неизвестно'),
            address=data.get('address', 'Неизвестно'),
            contract=data.get('contract', 'Неизвестно'),
            active=True if 0 > max(data.get('servicecats', {}).get('internet', {}).get('timeto', 0), 
                               data.get('servicecats', {}).get('intercomhandset', {}).get('timeto', 0), 
                               data.get('servicecats', {}).get('intercom', {}). get('timeto', 0)) - current_datetime < three_months_in_seconds else False, 
            relocate=is_relocatable,
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
                house_id=rbt_phone.house_id,
                flat_id=data.get('flatId'),
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
        flat_id=flat_id,
        main_contract=main_contract,
        contracts=contracts,
        phones=phones
    )

@router.patch('/v1/app/change_role', response_model=StatusResponse)
async def change_role_in_RBT(
    token: TokenDependency, 
    request: ChangeRoleRequest, 
    rbt: RBTDependency,
):
    return await crud.change_RBT_role(request.house_id, request.flat_id, request.role, rbt)



@router.delete('/v1/app/houses_flats_subscribers/{house_id}/{flat_id}', response_model=StatusResponse)
async def delete_user_from_houses_flats_subscribers_RBT(house_id: int, flat_id: int, rbt: RBTDependency, token: TokenDependency):

    return  await crud.delete_from_houses_flats_subscribers(house_id, flat_id, rbt)


@router.patch('/v1/app/relocate', response_model=StatusResponse)
async def relocate_users(
    request: RelocateRequest, 
    rbt: RBTDependency ,
    token: TokenDependency 
):

    flat_id = await crud.get_flat_from_RBT_by_house_id_and_flat(request.flat, request.address_house_id, rbt)

    if flat_id is None:
        # Создание новой квартиры
        try:
            flat_id = await crud.create_new_flat(request.flat,  request.address_house_id, rbt)

        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Не удалось создать квартиру: {e}")

    # Переселение
    response = await crud.change_flat_in_1C(flat_id, request.UUID2)
    if request.phones:
        if response.get('code') == 200:
            try:
                phones_list = [str(phone) for phone in request.phones]
                house_subscriber_ids_to_relocate = await crud.get_house_subscriber_ids_to_relocate_by_phones(phones_list, rbt)
                if house_subscriber_ids_to_relocate:
                    await crud.change_flat_id_in_RBT(house_subscriber_ids_to_relocate, flat_id,  rbt)
                return StatusResponse(status='success')
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Не удалось переселить: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail='Не удалось изменить квартиру в 1С')
    else:
        return StatusResponse(status='success')