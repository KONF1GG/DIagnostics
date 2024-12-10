import asyncio
import datetime
import json
import re
from tkinter import E
from typing import Optional, Dict, List
import aiohttp
from datetime import date
from aiohttp import ClientTimeout
import aiohttp
from fastapi import HTTPException
from jinja2 import DictLoader
import psycopg2
from redis.commands.search.result import Result
from app.depencies import RedisDependency
from app.schemas import TV24, TVIP, Camera1CModel, CameraCheckModel, CameraDataToChange, CameraRedisModel, CamerasData, FlussonicModel, LoginFailureData, RBT_phone, RedisLoginSearch, Service1C, ServiceOp, Smotreshka, ServiceOp, SmotreshkaOperator, TV24Operator, TVIPOperator
from app.models import Session, ORM_OBJECT, ORM_CLS
from sqlalchemy.exc import IntegrityError
from app import crud
from app.config import host_tokens
from app import config

# Добавление элемента в таблицы mysql (diagnostic_app )
async def add_item(session: Session, item: ORM_OBJECT) -> ORM_OBJECT:
    session.add(item)
    try:
        await session.commit()
    except IntegrityError as err:
        if err.orig.args[0] == 1062:
            raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существет")
        raise err
    return item


# Получение элемента из таблицы mysql (diagnostic_app )
async def get_item(session: Session, orm_class: ORM_CLS, item_id: int) -> ORM_OBJECT:
    orm_obj = await session.get(orm_class, item_id)
    if orm_obj is None:
        raise HTTPException(status_code=404,
                            detail=f'{orm_class.__name__} not found with id {item_id}')
    return orm_obj


# Поиск аварии по логину

async def find_failure_by_login(redis: RedisDependency, login_data: LoginFailureData) -> Optional[List[dict]]:
    if login_data is not None:
        # Поиск по hostId
        if login_data.hostId:
            query = f"@host:[{login_data.hostId} {login_data.hostId}]"
            result = await redis.ft("idx:failure").search(query)
            if result.docs:
                return json.loads(result.docs[0].json)

        # Поиск по addressCodes
        for address in login_data.addressCodes:
            query = f"@address:[{address} {address}]"
            result = await redis.ft("idx:failure").search(query)
            if result.docs:
                return json.loads(result.docs[0].json)

    return None


# Получение данных по логину из редиса
from fastapi import HTTPException

async def get_login_data(login: str, redis: RedisDependency) -> Dict:
    login_data = await redis.json().get(f"login:{login}")
    if login_data:
        return login_data
    else:
        raise HTTPException(status_code=404, detail=f'Данные по логину "{login}" не найдены')

async def get_cameras(login: str, retries: int = 2, timeout: int = 3) -> CamerasData | None:
    query_string = f'http://server1c.freedom1.ru/UNF_CRM_WS/hs/Grafana/anydata?query=cameras&login={login}'

    # Таймаут на запрос
    timeout_settings = ClientTimeout(total=timeout)

    async with aiohttp.ClientSession(timeout=timeout_settings) as session:
        attempt = 0
        while attempt < retries:
            try:
                async with session.get(query_string) as response:
                    if response.status != 200:
                        print(f"HTTP error occurred: {response.status} - {await response.text()}")
                        response.raise_for_status()  # Выбрасывает ошибку если статус не 200

                    data = await response.json()  # Предполагается, что ответ в формате JSON
                    return CamerasData(cameras=data)

            except aiohttp.ClientError as e:
                print(f"Aiohttp client error occurred: {e}")
                attempt += 1
                if attempt >= retries:
                    print(f"Max retries reached: {retries}")
                    return None

            except asyncio.TimeoutError:
                print(f"Request timed out. Attempt {attempt + 1} of {retries}. Retrying...")
                attempt += 1
                if attempt >= retries:
                    print(f"Max retries reached: {retries}")
                    return None

            except Exception as e:
                print(f"An error occurred: {e}")
                return None
            
async def fetch_services(uuid: str, uuid2: str):
    url = "http://server1c.freedom1.ru/UNF_CRM_WS/hs/Cabinet/allServices"
    payload = {"UUID": uuid, "UUID2": uuid2}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status != 200:
                    print(f"HTTP error occurred: {response.status} - {await response.text()}")
                    response.raise_for_status()

                services = await response.json()  # Предполагается, что ответ в формате JSON
                return services

    except aiohttp.ClientError as e:
        print(f"Aiohttp client error occurred: {e}")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None


async def get_cameras_difference(cameras_from_1C_raw, cameras_from_redis_list):
    cameras_from_1C = []

    if cameras_from_1C_raw is None or cameras_from_redis_list is None:
        return None
    # 1. Получение данных камер из 1С и их преобразование в объекты CameraCheckModel
    for camera_list in cameras_from_1C_raw:
        cameras_from_1C.extend([
            CameraCheckModel(
                id=camera.id,
                name=camera.name,
                ipaddress=camera.ipaddress,
                available=camera.available,
            )
            for camera in camera_list[1] if not camera.deleted # and camera.type == 'Личная'
        ])

    cameras_from_redis = []

    # 2. Получение данных из Redis
    for camera in cameras_from_redis_list:
        cameras_from_redis.append(
            CameraCheckModel(
                id=camera.id,
                name=camera.name,
                ipaddress=camera.ipaddress,
                available=camera.available,
            )
        )

    # 3. Сравнение камер с использованием схем CameraCheckModel
    comparison_results = await check_cameras_dif(cameras_from_redis, cameras_from_1C)

    return comparison_results if comparison_results else None



async def get_cameras_from_redis(login: str, redis, login_data):
    flatId = login_data.get('flatId')

    if flatId and flatId != 0:
        # Поиск камер по flatId в Redis
        query = f"@CamType:{{Личная}} @flatIds:[{flatId} {flatId}]"
        redis_result = await redis.ft("idx:camera").search(query)
        cameras_from_redis_list = [CameraRedisModel(id=json.loads(doc.json)['Id'],
                                                    name=json.loads(doc.json)['Name'],
                                                    host=json.loads(doc.json)['Host'],
                                                    ipaddress=json.loads(doc.json)['IP'],
                                                    **json.loads(doc.json)) for doc in redis_result.docs]
        return cameras_from_redis_list
    else:
        cameras_from_redis_list = []
        query = f"@CamType:{{Личная}}"
        redis_result = await redis.ft("idx:camera").search(query)
        all_cameras_from_redis_list = [CameraRedisModel(id=json.loads(doc.json)['Id'],
                                                        name=json.loads(doc.json)['Name'],
                                                        host=json.loads(doc.json)['Host'],
                                                        ipaddress=json.loads(doc.json)['IP'],
                                                        **json.loads(doc.json)) for doc in redis_result.docs]
        for camera in all_cameras_from_redis_list:
            if login in camera.houseIds:
                cameras_from_redis_list.append(camera)
        return cameras_from_redis_list
    

async def check_cameras_dif(redis_cameras: List[CameraCheckModel],
                            cameras_from_1c: List[CameraCheckModel]):
    differences = []

    # Преобразуем список камер из Redis в словарь по id для быстрого поиска
    redis_cameras_dict = {camera.id: camera for camera in redis_cameras}

    # 1. Сравнение камер по наличию и характеристикам
    for camera_1c in cameras_from_1c:
        camera_id = camera_1c.id  # ID камеры из 1С

        if camera_id not in redis_cameras_dict:
            # Камера есть в 1С, но отсутствует в Redis
            differences.append({
                'Redis': None,
                'DB_1C': {
                    camera_id: {
                        'name': camera_1c.name,
                        'ipaddress': camera_1c.ipaddress,
                        'available': camera_1c.available
                    }
                }
            })
        else:
            redis_camera = redis_cameras_dict[camera_id]

            # Проверяем на различия между камерами в 1С и Redis
            diff = {}
            if camera_1c.name != redis_camera.name:
                diff['name'] = camera_1c.name
            if camera_1c.ipaddress != redis_camera.ipaddress:
                diff['ipaddress'] = camera_1c.ipaddress
            if camera_1c.available != redis_camera.available:
                diff['available'] = camera_1c.available

            if diff:  # Если есть различия, добавляем их в список
                differences.append({
                    'Redis': {
                        camera_id: {
                            key: redis_camera.__dict__[key]
                            for key in diff.keys()  # Добавляем только те поля, которые различаются
                        }
                    },
                    'DB_1C': {
                        camera_id: diff
                    }
                })

    # 2. Проверяем, есть ли камеры в Redis, которых нет в 1С
    ids_from_1c = {camera.id for camera in cameras_from_1c}
    for redis_camera in redis_cameras:
        if redis_camera.id not in ids_from_1c:
            differences.append({
                'Redis': {
                    redis_camera.id: {
                        'name': redis_camera.name,
                        'ipaddress': redis_camera.ipaddress,
                        'available': redis_camera.available
                    }
                },
                'DB_1C': None
            })

    return differences


async def get_services_from_1C(services_from_1c):
    print(services_from_1c)
    return [
        {
            'name': service['name'],
            'status': service.get('status', 'Не указано'),
            'count': service.get('count', 0),
            'price': service.get('price', 0)
        }
        for service_list in services_from_1c
        for service in service_list.get('services', [])
        if service['productName'].startswith('Услуга видеонаблюдения')
    ]


def extract_archive_days(service_name):
    """Функция для извлечения количества дней архива из названия услуги."""
    match = re.search(r'\d+', service_name)
    return int(match.group()) if match else None


async def get_services_differences(services_from_1c, cameras_from_1c):
    differences = {
        'missing_services_in_cameras': [],
        'missing_services_in_1C': [],
        'count_discrepancies': [],
        'status_discrepancies': [],
        'available_discrepancies': []
    }

    if not cameras_from_1c:
        return None

    service_count_dict = {}

    # Count services from camera data
    for camera in cameras_from_1c.cameras:
        if camera.deleted or camera.type != 'Личная':
            continue
        service_name = camera.service
        archive_days = extract_archive_days(service_name)

        if service_name not in service_count_dict:
            service_count_dict[service_name] = {
                'count': 1,
                'status': camera.status,
                'archive_days': archive_days,
                'available': camera.available
            }
        else:
            service_count_dict[service_name]['count'] += 1

    # Compare services from 1C with services from cameras
    for svc in services_from_1c:
        svc_name = svc['name']
        svc_count = svc['count']
        svc_status = svc['status']
        svc_archive_days = extract_archive_days(svc_name)

        if svc_name in service_count_dict:
            # Camera service data
            camera_data = service_count_dict[svc_name]
            camera_count = camera_data['count']
            camera_status = camera_data['status']
            camera_available = camera_data['available']

            # Check for count discrepancies
            if camera_count != svc_count:
                differences['count_discrepancies'].append(
                    f"Количество услуг '{svc_name}' отличается: в 1С ({svc_count}), в камерах ({camera_count})"
                )

            # Check for status discrepancies
            if camera_status != svc_status:
                differences['status_discrepancies'].append(
                    f"Статус услуги '{svc_name}' отличается: в 1С ('{svc_status}'), в камерах ('{camera_status}')"
                )
        else:
            # Look for a service with the same archive days
            for camera_service, camera_data in service_count_dict.items():
                if camera_data['archive_days'] != svc_archive_days:
                    differences['missing_services_in_cameras'].append(
                        f"Обнаружено несоответствие в названии услуги: '{svc_name}' из 1С и '{camera_service}' из камер (разница в числе дней архива)"
                    )
                    break

    # Check for overall count mismatch
    if len(services_from_1c) != len(service_count_dict):
        differences['missing_services_in_cameras'].append(
            f"Количество услуг в 1С и камерах не совпадает: в 1С ({len(services_from_1c)}), в камерах ({len(service_count_dict)})"
        )

    return differences

async def get_cameras_form_flussonic(cameras):
    cameras_list = []
    for camera in cameras:
        host = camera.host
        url = camera.URL

        if host and url:
            token = await get_token_for_host(host)
            stream_data = await fetch_flussonic_stream(host, url, token)

            if not stream_data.get('error'):
                cameras_list.append(FlussonicModel(
                    name=stream_data.get('name', ''),
                    title=stream_data.get('title', ''),
                    alive=stream_data.get('stats', {}).get('alive'),
                    running=stream_data.get('stats', {}).get('running'),
                    bytes_in=stream_data.get('stats', {}).get('bytes_in')
                ))

    return cameras_list


async def check_flussonic_streams(cameras):
    flussonic_results = {
        'failed_alive_checks': [],
        'failed_running_checks': [],
        'invalid_bytes_in': []
    }

    async def check_camera(camera_model):
        if not camera_model.deleted and camera.available:
            host = camera_model.host
            url = camera_model.URL

            if host and url:
                token = await get_token_for_host(host)
                stream_data = await fetch_flussonic_stream(host, url, token)

                # Check parameters safely
                stats = stream_data.get('stats', {})
                alive = stats.get('alive')
                running = stats.get('running')
                bytes_in = stats.get('bytes_in')

                if alive is not None and not alive:
                    flussonic_results['failed_alive_checks'].append(
                        f"Камера {camera_model.name}: Статус 'alive' = False"
                    )

                if running is not None and not running:
                    flussonic_results['failed_running_checks'].append(
                        f"Камера {camera_model.name}: Статус 'running' = False"
                    )

                if bytes_in is not None and bytes_in <= 0:
                    flussonic_results['invalid_bytes_in'].append(
                        f"{camera_model.name}: Некорректное значение 'bytes_in' = {bytes_in}"
                    )

    if isinstance(cameras, (Camera1CModel, CameraRedisModel)):
        return await crud.get_camera_form_flussonic(cameras)
    else:
        if isinstance(cameras, list):
            for camera in cameras:
                await check_camera(camera)
        else:
            for camera in cameras.cameras:
                await check_camera(camera)

    return flussonic_results

async def get_camera_form_flussonic(camera_model):
    host = camera_model.host
    url = camera_model.URL

    if host and url:
        token = await get_token_for_host(host)
        stream_data = await fetch_flussonic_stream(host, url, token)

        return FlussonicModel(name=stream_data['name'],
                                alive=stream_data['stats']['alive'],
                                running=stream_data['stats']['running'],
                                bytes_in=stream_data['stats']['bytes_in'])



async def fetch_flussonic_stream(host: str, url: str, token: str):
    # Запрос к Flussonic
    async with aiohttp.ClientSession() as session:
        async with session.get(f"https://{host}/streamer/api/v3/streams/{url}", 
                               headers={"Authorization": f"Bearer {token}"}) as response:
            response_data = await response.json()
            return response_data


async def get_token_for_host(host):
    token = host_tokens.get(host)

    if not token:
        raise ValueError(f"Токен для хоста {host} не найден.")

    return token


async def get_TV_services_from_1c(login: str) -> List[Service1C] | None:
    url = f"http://server1c.freedom1.ru/UNF_CRM_WS/hs/Grafana/anydata?query=external_services&login={login}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                response.raise_for_status()
                data = await response.json()
                if data:
                    services = [Service1C(**service) for service in data]
                    return services
                else:
                    return None
    except Exception as e:
        print(f'{e}')
        return None


async def get_tv24_data(login: str, token: str) -> TV24:
    url = f"https://api.24h.tv/v2/users/{login}/subscriptions/current?token={token}"
    def get_status(end_at: str):
        formatted_date = datetime.datetime.strptime(end_at, "%Y-%m-%dT%H:%M:%SZ")
        if formatted_date > datetime.datetime.now():
            return 'Активный'
        else:
            return 'Неактивный'
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                response.raise_for_status()  # Проверка на ошибки HTTP-запроса
                data = await response.json()
                if data:
                    data = [ServiceOp(
                                    id=service['packet']['id'],
                                    name=service['packet']['name'],
                                    status=get_status(service['end_at'])
                                    ) for service in data]
                return data
    except Exception as e:
        print(e)
        return None


async def get_smotreshka_data(login: str) -> Dict:
    url = f'http://server1c.freedom1.ru/UNF_CRM_WS/hs/mwapi/getLfstrmPackets?login={login}'
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                response.raise_for_status()
                data = await response.json()
                data = [ServiceOp(
                                id=int(service['id']), 
                                name=service['name'], 
                                status='Активный'
                                ) for service in data]
                return data
    except Exception as e:
        print(e)
        return None


# Функция для получения данных для ТВИП
async def get_tvip_data(userId: str, service_name: str) -> TVIP:
    url = f"https://my.tvip.media/api/provider/account_subscriptions?account={userId}&limit=25&start=0"
    headers = {"Authorization": f"Basic {config.TVIP_TOKEN}", "Accept": "*/*"}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                response.raise_for_status()  # Проверка на ошибки HTTP-запроса
                data = await response.json()
                if data:
                    data = [ServiceOp(
                                        id=service['tarif'], 
                                        name=service_name,
                                        status='Активный' if not service['stop'] else 'Неактивный'
                                        ) for service in data['data'] if not service['stop']]
                return data
    except Exception as e:
        print(e)
        return None
        

async def camera_update_1c(camera_id: int, camera_data: CameraDataToChange, old_camera_data: Camera1CModel):
    url = "http://192.168.111.61/UNF_FULL_WS/hs/apps/setCamera"
    headers = {
        "Authorization": f"Bearer {config.UPDATE_CAMERA_TOKEN}",
        "Content-Type": "application/json"
    }
    data = {
        "id": camera_id,
        "name": camera_data.name,
        "ip": camera_data.ip,
        "CamType": old_camera_data.type
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=data) as response:
                return await response.json()
    except Exception as e:
        return e
    


async def get_redis_key_data(login: str, redis) -> Result:
    value = await redis.json().get(f"login:{login}")
    if not value:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return value

async def get_logins_by_flatId_redis(flat_id: int, redis: RedisDependency):

    query = f"@flatId:[{flat_id} {flat_id}]"
    search_result: Result = await redis.ft("idx:client").search(query)
    if not search_result:
        raise HTTPException(status_code=404, detail="Логины не найдены по flatId")
    return search_result.docs

async def get_numbers_rbt(flat_id: int, rbt) -> List[RBT_phone]:
    async with rbt.transaction():
        query = """
        SELECT fs.house_subscriber_id, fs.role, sm.id, sm.subscriber_name, sm.subscriber_patronymic
        FROM houses_flats_subscribers fs
        JOIN houses_subscribers_mobile sm
        ON fs.house_subscriber_id = sm.house_subscriber_id
        WHERE fs.house_flat_id = $1
        """
        result = await rbt.fetch(query, flat_id)
        
        subs_list = [
            RBT_phone(
                house_id=row['house_subscriber_id'],
                role=row['role'],
                name=row['subscriber_name'],
                phone=row['id'],
                patronymic=row['subscriber_patronymic'],

            ) 
            for row in result
        ]

    return subs_list


async def get_flats(house_id: int, rbt):
    async with rbt.transaction():
        query = """
        SELECT house_flat_id
        FROM "houses_flats_subscribers"
        WHERE "house_subscriber_id" = $1
        """
        result = await rbt.fetch(query, house_id)
        
        flats_list = [row['house_flat_id'] for row in result]

    return flats_list


async def get_logins_from_redis(flat_ids: List[int], redis):
    search_query = " | ".join([f"@flatId:[{flat_id} {flat_id}]" for flat_id in flat_ids])
    
    result = await redis.ft('idx:client').search(search_query)
    
    logins = []
    for doc in result.docs:
        logins.append(doc)
    
    return logins


async def search_logins(search_login: str, redis) -> List[RedisLoginSearch]:
    result = await redis.ft('idx:searchLogin').search(search_login)
    # search_query = f"{search_login} | {search_login.capitalize()}"
    # result = await redis.ft('idx:searchLogin').search(search_query)
    logins_list = []
    for doc in result.docs:
        data = json.loads(doc.json)
        if 'loginserv' not in doc.id:
            logins_list.append(RedisLoginSearch(login=data.get('login', ''), name=data.get('name', ''), contract=data.get('contract', ''), address=data.get('address', '')))

    return logins_list
