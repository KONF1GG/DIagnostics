"""
Схемы данных для FastAPI.
"""

import uuid
from typing import Any, Literal, Dict, List, Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class ItemId(BaseModel):
    """Идентификатор объекта."""
    id: int


class BaseUser(BaseModel):
    """Базовые данные пользователя."""
    username: str
    password: str


class CreateUser(BaseUser):
    """Схема создания пользователя."""
    firstname: str
    lastname: str
    middlename: str
    password: str
    role_id: Optional[int] = None


class Reg(BaseUser):
    """Схема регистрации пользователя."""


class UpdateUser(BaseModel):
    """Схема обновления данных пользователя."""
    username: Optional[str] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    middlename: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None


class UserModel(BaseModel):
    """Модель пользователя."""
    id: int
    firstname: str
    lastname: str
    middlename: str
    username: str
    role: str


class ResponseUserData(UserModel):
    """Ответ с данными пользователя."""
    firstname: str
    lastname: str
    middlename: str
    isItself: bool
    current_user_role: str


class Login(BaseUser):
    """Схема входа пользователя."""

class LoginResponse(BaseModel):
    """Ответ на вход пользователя."""
    token: uuid.UUID


class CreateRole(BaseModel):
    """Схема создания роли."""
    name: str


class StatusResponse(BaseModel):
    """Ответ с текущим статусом."""
    status: Literal['success', 'deleted', 'error']


class FailureDetail(BaseModel):
    """Детали сбоя."""
    isFailure: bool
    failure: Optional[list] = None


class LoginFailureData(BaseModel):
    """Данные о аварии """
    hostId: Optional[int] = None
    addressCodes: Optional[List[int]] = None


class ConnData(BaseModel):
    """Данные подключения."""
    GMT: Optional[int] = None
    ip_addr: Optional[str] = None
    onu_mac: Optional[str] = None


class RediusConnData(ConnData):
    """Данные подключения к радиусу."""
    active: bool
    json_data: Optional[str] = None
    time_to: Optional[datetime] = None


class ServiceCategory(BaseModel):
    """Категория сервиса."""
    timeto: Optional[int] = None


class ServiceCats(BaseModel):
    """Категории сервисов."""
    internet: Optional[ServiceCategory] = None


class RedisConnData(ConnData):
    """Данные из Redis."""
    active: bool
    servicecats: Optional[ServiceCats] = None
    mac: Optional[str] = None
    vlan: Optional[str] = None


class LoginConnData(BaseModel):
    """Данные для страница Сеть."""
    radius: RediusConnData
    redis: RedisConnData
    differences: Dict[str, Any]


class CameraModel(BaseModel):
    """Базовые параметры камеры."""
    id: int
    name: str
    ipaddress: Optional[str] = None
    available: Optional[bool] = None
    host: Optional[str] = None
    URL: Optional[str] = None


class Camera1CModel(CameraModel):
    """Параметры камеры из 1С."""
    archive: Optional[int] = None
    service: Optional[str] = None
    macaddress: Optional[str] = None
    deleted: Optional[bool] = None
    status: Optional[str] = None
    type: Optional[str] = None


class CameraRedisModel(CameraModel):
    """Параметры камеры из Redis."""
    houseIds: Optional[List[int]] = None
    Model: Optional[str] = None


class CamerasData(BaseModel):
    """Список камер."""
    cameras: List[Camera1CModel]


class CameraModelShow(BaseModel):
    """Параметры камеры для отображения."""
    Parameter: Union[int, str]
    Value: Optional[Union[int, str, list[int], bool]] = None


class CameraCheckModel(BaseModel):
    """Поля камеры для сравнения."""
    id: int
    name: str
    ipaddress: str
    available: Optional[bool] = None
    type: Optional[str] = None


class CameraDifference(BaseModel):
    """Различия параметров камер."""
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
    """Сервис с именем и описанием."""
    name: str
    description: str


class Service1C(BaseModel):
    """Сервис из 1С."""
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


class ServiceTV(BaseModel):
    """Базовая модель для ТВ сервисов"""
    id: int
    name: str
    status: str

class Service1c(ServiceTV):
    """Сервисы 1С"""

class ServiceOp(ServiceTV):
    """Оператор сервиса."""

class SmotreshkaOperator(ServiceOp):
    """Оператор Smotreshka."""
    login: str
    password: str
    not_turnoff_if_not_used: bool


class TV24Operator(ServiceOp):
    """Оператор TV24."""
    phone: str


class TVIPOperator(ServiceOp):
    """Оператор TVIP."""
    login: str
    password: str


class Smotreshka(BaseModel):
    """Данные Smotreshka."""
    login: str
    password: str
    not_turnoff_if_not_used: bool
    services1c: List[Service1C]
    servicesOp: List[ServiceOp]
    error: str


class TVIP(BaseModel):
    """Данные TVIP."""
    login: str
    password: str
    services1c: List[Service1C]
    servicesOp: List[ServiceOp]
    error: str


class TV24(BaseModel):
    """Данные TV24."""
    phone: str
    services1c: List[Service1C]
    servicesOp: List[ServiceOp]
    error: str
    additional_phones: Optional[List[str]] = None
    ban_on_app: bool


class TVResponse(BaseModel):
    """Ответ с данными TV."""
    smotreshka: Optional[Dict] = None
    tvip: Optional[Dict] = None
    _24tv: Optional[Dict] = None


class CameraDataToChange(BaseModel):
    """Данные для изменения камеры."""
    name: Optional[str] = None
    ip: Optional[str] = None
    id: int
    CamType: str


class RedisLogin(BaseModel):
    """Данные Redis."""
    house_id: int
    flat_id: int
    login: str
    address: str
    contract: str


class RBT(BaseModel):
    """Данные RBT."""
    house_subscriber_id: int
    flat_id: int
    role: int


class RBT_phone(RBT):
    """Данные телефона RBT."""
    phone: int
    name: str
    patronymic: str


class LoginsData(BaseModel):
    """Данные логинов."""
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
    """Телефон с привязанными договорами."""
    contracts: List[RedisLogin]


class AppResponse(BaseModel):
    """Ответ эндпоинта Приложения"""
    address_in_app: str
    flat_id: int
    contracts: List[LoginsData]
    main_contract: str
    phones: List[Phone]


class RedisLoginSearch(BaseModel):
    """Поиск логинов в Redis."""
    login: str
    contract: str
    name: str
    address: str
    timeTo: int | None = None


class SearchLogins(BaseModel):
    """Результаты поиска логинов в Редисе"""
    logins: List[RedisLoginSearch]


class LogData(BaseModel):
    """Данные лога."""
    login: str
    page: str
    action: str
    success: bool
    message: str
    url: str
    payload: Dict[str, Any]


class ChangeRoleRequest(BaseModel):
    """Запрос на изменение роли."""
    house_id: int
    flat_id: int
    role: int


class RelocateRequest(BaseModel):
    """Запрос на переселение"""
    phones: Optional[List[int]] = None
    UUID2: str
    flat: str
    address_house_id: int


class Action(BaseModel):
    """Действие нажатии на кнопку для логирования"""
    name: str
    date: datetime
    login: str
    page: str
    action: str
    status: bool


class Payment(BaseModel):
    """Данные платежа."""
    dt: str
    timestamp: int
    sum: float
    description: str
    comment: str


class FailurePay(BaseModel):
    """Данные неудачного платежа."""
    dt: str
    timestamp: int
    status: str
    sum: float
    reason: str | None = None
    autopayment: bool
    description: str
    paymentId: str


class RecPaymnent(BaseModel):
    """Данные рекуррентного платежа."""
    recurringPayment: str | None = None


class Destination(BaseModel):
    """Данные получателя."""
    name: str
    phone: str


class NotificationSMS(BaseModel):
    """Уведомление SMS."""
    notification: str
    destination: list[Destination]
    text: str
    dt: str


class PaymentResponseModel(BaseModel):
    """Ответ с данными платежей."""
    payments: List[Payment] | None = None
    canceled_payments: List[FailurePay] | None = None
    recurringPayment: RecPaymnent | None
    notifications: List[NotificationSMS] | None = None


class IntercomService(BaseModel):
    """Сервис домофона."""
    service: str
    category: str
    timeto: str


class CategoryStatus(BaseModel):
    """Статус категории."""
    service: Optional[str] = None
    category: Optional[str] = None
    timeto_1c: Optional[int] = None
    timeto_redis: Optional[int] = None
    status: str


class RBTApsSettings(BaseModel):
    """Настройки APS."""
    house_flat_id: int
    address_house_id: int
    manual_block: Optional[bool]
    auto_block: Optional[bool]
    open_code: Optional[str]
    white_rabbit: Optional[bool]
    admin_block: Optional[bool]

    @classmethod
    @field_validator('manual_block', 'auto_block', 'white_rabbit', 'admin_block', mode='before')
    def convert_to_bool(cls, value):
        """Конвертация значения в bool."""
        if value is None:
            return None

        if isinstance(value, bool):
            return value

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
    """Проход"""
    date: datetime
    address: str
    type: str


class IntercomResponse(BaseModel):
    """Ответ для странички Домофон."""
    categories: List[CategoryStatus]
    errors: List[str]
    update_instructions: Optional[str] = None
    aps_settings: Optional[RBTApsSettings] = None
    rbt_link: str
    passages: List[Passage]


class Search2ResponseData(BaseModel):
    """Ответ поиска по ВИКИ без истории диалога"""
    combined_context: str = Field(..., description="Контекст Вики")
    hashs: List[str] = Field(..., description="ID контекстов которые используются")


class MistralRequest(BaseModel):
    """Запрос к Mistral."""
    text: str = Field(..., description="Текст запроса пользователя")
    combined_context: str = Field(..., description="Контекст для обработки запроса")
    chat_history: str = Field(..., description="История предыдущих сообщений в чате")
    input_type: Literal['voice', 'csv', 'text'] = Field(
        default='text',
        description="Тип входных данных: голос, csv или текст"
    )


class FixManualBlockRequest(BaseModel):
    """Запрос на исправление блокировки."""
    house_flat_id: int


class FixManualBlockResponse(BaseModel):
    """Ответ на исправление блокировки."""
    status: str
    message: str
    changed: bool
    house_flat_id: int