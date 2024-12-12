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
from app.schemas import TV24, TVIP, AppResponse, LoginsData, Phone, RBT_phone, RedisLogin, Service1C, Service1c, ServiceOp, Smotreshka, TVResponse
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

    # Количество секунд в 3 месяцах (30.44 дня в среднем)
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
        contracts.append(LoginsData(
            login=data.get('login', ''),
            name=data.get('name', 'Неизвестно'),
            address=data.get('address', 'Неизвестно'),
            contract=data.get('contract', 'Неизвестно'),
            active=True if 0 > max(data.get('servicecats', {}).get('internet', {}).get('timeto', 0), 
                               data.get('servicecats', {}).get('intercomhandset', {}).get('timeto', 0), 
                               data.get('servicecats', {}).get('intercom', {}). get('timeto', 0)) - current_datetime < three_months_in_seconds else False, 
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
