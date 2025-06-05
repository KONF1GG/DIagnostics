from abc import ABC
from abc import ABC
import uuid
from typing import Any, Literal, Dict, List, Optional, Union
from typing import Any, Literal, Dict, List, Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from datetime import date
from datetime import date


class ItemId(BaseModel):
    id: int


class BaseUser(BaseModel):
    username: str
    password: str



class CreateUser(BaseUser):
    firstname: str
    lastname: str
    middlename: str
    password: str
    role_id: Optional[int] = None

class Reg(BaseUser):
    pass


class UpdateUser(BaseModel):
    username: Optional[str] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    middlename: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None


class UserModel(BaseModel):
    id: int
    firstname: str
    lastname: str
    middlename: str
    username: str
    role: str

class ResponseUserData(UserModel):
    firstname: str
    lastname: str
    middlename: str
    isItself: bool
    current_user_role: str


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
    id: int
    CamType: str




# class RBT_flat(BaseModel):
#     flat_id: int

class RedisLogin(BaseModel):
    house_id: int
    flat_id: int
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
    address_house_id: int
    name: str
    flat: str
    flat_id: int
    address: str
    contract: str
    active: bool
    relocate: str | None
    UUID2: str

class Phone(RBT_phone):
    contracts: List[RedisLogin]

class AppResponse(BaseModel):
    address_in_app: str
    flat_id: int
    contracts: List[LoginsData]
    main_contract: str
    phones: List[Phone]

class RedisLoginSearch(BaseModel):
    login: str
    contract: str
    name: str
    address: str
    timeTo: int | None = None

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

class RelocateRequest(BaseModel):
    phones: Optional[List[int]] = None
    UUID2: str
    flat: str
    address_house_id: int


class Action(BaseModel):
    name: str
    date: datetime
    login: str
    page: str
    action: str
    status: bool


class Payment(BaseModel):
    dt: str
    timestamp: int
    sum: float
    description: str
    comment: str

class FailurePay(BaseModel):
    dt: str
    timestamp: int
    status: str
    sum: float
    reason: str | None = None
    autopayment: bool
    description: str
    paymentId: str

class RecPaymnent(BaseModel):
    recurringPayment: str | None = None

class Destination(BaseModel):
    name: str
    phone: str

class NotificationSMS(BaseModel):
    notification: str
    destination: list[Destination]
    text: str
    dt: str

class PaymentResponseModel(BaseModel):
    payments: List[Payment] | None = None
    canceled_payments: List[FailurePay] | None = None
    recurringPayment: RecPaymnent | None
    notifications: List[NotificationSMS] | None = None


class IntercomService(BaseModel):
    service: str
    category: str
    timeto: str

class CategoryStatus(BaseModel):
    category: str
    timeto_1c: Optional[int] = None
    timeto_redis: Optional[int] = None
    status: str  # e.g., "match", "discrepancy", "only_in_1c", "only_in_redis", "missing"

class RBTApsSettings(BaseModel):
    address_house_id: int
    manual_block: Optional[bool]
    auto_block: Optional[bool] 
    open_code: Optional[str] 
    white_rabbit: Optional[bool]
    admin_block: Optional[bool]

    @field_validator('manual_block', 'auto_block', 'white_rabbit', 'admin_block', mode='before')
    def convert_to_bool(cls, value):
        if value is None:
            return None
        
        if isinstance(value, bool):
            return bool
        
        if isinstance(value, (int, float)):
            return bool(value)
        
        if isinstance(value, str):
            value = value.strip().lower()
            if value in ('1', 'true', 't', 'yes', 'y', 'on'):
                return True
            if value in ('0', 'false', 'f', 'no', 'n', 'off', ''):
                return False
            return bool(value)
    
        return bool(value)

class Passage(BaseModel):
    date: datetime
    address: str  # Адрес (mechanizmaDescription)
    type: str  # Тип события (например, "открытие ключом")
    
class IntercomResponse(BaseModel):
    categories: List[CategoryStatus]
    errors: List[str]
    update_instructions: Optional[str] = None
    aps_settings: RBTApsSettings
    rbt_link: str
    passages: List[Passage]