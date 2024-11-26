import asyncio
import json
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Optional

from redis import ResponseError
from app import crud
from app.depencies import RedisDependency, SessionRediusDependency, TokenDependency, RBTDependency
from app.schemas import TV24, TVIP, Service1C, Service1c, ServiceOp, Smotreshka, TVResponse
from app import config

router = APIRouter()

@router.get('/v1/app', response_model=List)
async def get_connection_data(
    token: TokenDependency,
    redis: RedisDependency,
    rbt: RBTDependency,
    login: Optional[str] = Query(None)
):
    """Эндпоинт для получения информации приложения"""

    # redis_data = await crud.get_redis_key_data(login, redis)
    # flat_id = redis_data.get("flatId", 0)

    # if flat_id == 0:
    #     return {"message": "Договор не зарегистрирован в приложении"}
    
    # logins_list = await crud.get_logins_by_flatId_redis(flat_id, redis)

    # data_list = []
    # for doc in logins_list:
    #     data = json.loads(doc.json) 
    #     login = data.get('login')
    #     name = data.get('name')
    #     address = data.get('address')
    #     contract = data.get('contract')

    #     data_list.append({
    #         'login': login,
    #         'name': name,
    #         'address': address,
    #         'contract': contract
    #     })

    flat_id = 126458
    rbt_data = await crud.get_numbers_rbt(flat_id, rbt)
    
    for data in rbt_data:
        flats = await crud.get_flats(data.house_id, rbt)
        print(f"Flats for house_id {data.house_id}: {flats}")
    
    flat_ids = [flat.flat_id for flat in flats]
    logins = await crud.get_logins_from_redis(flat_ids, redis)

    print("Logins and addresses from Redis:", logins)

    

    return rbt_data 