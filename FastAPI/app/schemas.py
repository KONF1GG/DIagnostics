from abc import ABC
from abc import ABC
import string
import uuid
from typing import Any, Literal, Dict, List, Optional, Union
from typing import Any, Literal, Dict, List, Optional, Union
from datetime import datetime
from pydantic import BaseModel
from datetime import date
from datetime import date


class ItemId(BaseModel):
    id: int


class BaseUser(BaseModel):
    name: str
    password: str


class CreateUser(BaseUser):
    role_id: Optional[int] = None

class Reg(BaseUser):
    pass


class UpdateUser(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None


class UserModel(BaseModel):
    id: int
    name: str
    role: str


class Login(BaseUser):
    pass


class LoginResponse(BaseModel):
    token: uuid.UUID


class CreateRole(BaseModel):
    name: str


class StatusResponse(BaseModel):
    status: Literal['success', 'deleted', 'error']


class FailureDetail(BaseModel):
    isFailure: bool
    failure: Optional[list] = None


class LoginFailureData(BaseModel):
    hostId: Optional[int] = None
    addressCodes: Optional[List[int]] = None


class ConnData(BaseModel):
    GMT: Optional[int] = None
    ip_addr: Optional[str] = None
    onu_mac: Optional[str] = None


class RediusConnData(ConnData):
    active: bool
    json_data: Optional[str] = None
    time_to: Optional[datetime] = None


class ServiceCategory(BaseModel):
    timeto: Optional[int] = None


class ServiceCats(BaseModel):
    internet: Optional[ServiceCategory] = None


class RedisConnData(ConnData):
    active: bool
    servicecats: Optional[ServiceCats] = None
    mac: Optional[str] = None
    vlan: Optional[str] = None


class LoginConnData(BaseModel):
    radius: RediusConnData
    redis: RedisConnData
    differences: Dict[str, Any]

class CameraModel(BaseModel, ABC):
    """Базовые параметры камеры"""
    id: int
    name: str
    ipaddress: Optional[str] = None
    available: Optional[bool] = None
    host: Optional[str] = None
    URL: Optional[str] = None


class Camera1CModel(CameraModel):
    """Дополнительные параметры, которые есть в 1С"""
    archive: Optional[int] = None
    service: Optional[str] = None
    macaddress: Optional[str] = None
    deleted: Optional[bool] = None
    status: Optional[str] = None
    type: Optional[str] = None


class CameraRedisModel(CameraModel):
    """Дополнительные параметры для камеры из Редиса"""
    houseIds: Optional[List[int]] = None
    Model: Optional[str] = None


class CamerasData(BaseModel):
    """Список камер класса Camera1CModel"""
    cameras: List[Camera1CModel]


class CameraDataToChange(BaseModel):
    """Данные, которые можно поменять в форме изменения данных камеры 1С"""
    name: Optional[str] = None
    ip: Optional[str] = None


class CameraModelShow(BaseModel):
    """Класс для генерации таблиц параметров камеры из разных баз данных"""
    Parameter: Union[int, str]
    Value: Optional[Union[int, str, list[int], bool]] = None


class CameraCheckModel(BaseModel):
    """Поля камеры, которые будут сравниваться (1С и Редис)"""
    id: int
    name: str
    ipaddress: str
    available: Optional[bool] = None
    type: Optional[str] = None


class CameraDifference(BaseModel):
    """Параметры по которым различаются камеры из Редиса и 1С"""
    Parameter: str
    DB_1C: Optional[Union[int, str, bool, list]] = None
    Redis: Optional[Union[int, str, bool, list]] = None


class ServiceViwModel(BaseModel):
    """Модель для вывода таблицы сервисов"""
    Name: str
    Status: str
    Count: int
    Price: float


class FlussonicModel(BaseModel):
    """Параметры из Флюсоника"""
    name: str
    title: str
    alive: bool
    running: bool
    bytes_in: Optional[int] = None

class Service(BaseModel):
    name: str
    description: str  


class Service1C(BaseModel):
    service: str
    status: str
    date: str
    login: str
    password: str
    operator: str
    userId: str
    serviceId: str
    type: Optional[int] = None
    not_turnoff_if_not_used: bool
    ban_on_app: bool


class Service1c(BaseModel):
    name: str
    id: str
    status: str

class ServiceOp(BaseModel):
    id: int
    name: str
    status: str

class SmotreshkaOperator(ServiceOp):
    login: str
    password: str
    not_turnoff_if_not_used: bool

class TV24Operator(ServiceOp):
    phone: str

class TVIPOperator(ServiceOp):
    login: str
    password: str

class Smotreshka(BaseModel):
    login: str
    password: str
    not_turnoff_if_not_used: bool
    services1c: List[Service1C]
    servicesOp: List[ServiceOp]
    error: str


class TVIP(BaseModel):
    login: str
    password: str
    services1c: List[Service1C]
    servicesOp: List[ServiceOp]
    error: str


class TV24(BaseModel):
    phone: str
    services1c: List[Service1C]
    servicesOp: List[ServiceOp]
    error: str
    additional_phones: Optional[List[str]] = None
    ban_on_app: bool


class TVResponse(BaseModel):
    smotreshka: Optional[Dict] = None
    tvip: Optional[Dict] = None
    _24tv: Optional[Dict] = None


class CameraDataToChange(BaseModel):
    """Данные, которые можно поменять в форме изменения данных камеры 1С"""
    name: Optional[str] = None
    ip: Optional[str] = None



# class RBT_flat(BaseModel):
#     flat_id: int

class RedisLogin(BaseModel):
    login: str
    address: str
    contract: str

class RBT(BaseModel):
    house_id: int
    flat_id: int
    role: int

class RBT_phone(RBT):
    phone: int # id
    name: str
    patronymic: str

class LoginsData(BaseModel):
    phone: str
    login: str
    name: str
    address: str
    contract: str
    active: bool
    relocate: bool
    UUID2: str

class Phone(RBT_phone):
    contracts: List[RedisLogin]

class AppResponse(BaseModel):
    address_in_app: str
    contracts: List[LoginsData]
    phones: List[Phone]

class RedisLoginSearch(BaseModel):
    login: str
    contract: str
    name: str
    address: str

class SearchLogins(BaseModel):
    logins: List[RedisLoginSearch]

class LogData(BaseModel):
    login: str
    page: str
    action: str
    success: bool
    message: str
    url: str
    payload: Dict[str, Any]

class ChangeRoleRequest(BaseModel):
    house_id: int
    flat_id: int
    role: int