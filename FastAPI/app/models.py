"""
Модели базы данных для приложения.
"""

import datetime
import uuid
from typing import Optional, Union
from uuid import UUID

from sqlalchemy import Integer, String, ForeignKey, func, DateTime, CHAR, Text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql.functions import now

from app.config import DSN, RADIUS_DSN

# Асинхронные движки для подключения к базам данных
engine = create_async_engine(DSN)
radius_engine = create_async_engine(RADIUS_DSN)

# Сессии для работы с базами данных
SessionRadius = async_sessionmaker(bind=radius_engine, expire_on_commit=False)
Session = async_sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """Базовый класс для всех моделей."""


class User(Base):
    """Модель пользователя."""
    __tablename__ = 'user'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    firstname: Mapped[str] = mapped_column(String(100), nullable=False)
    lastname: Mapped[str] = mapped_column(String(100), nullable=False)
    middlename: Mapped[str] = mapped_column(String(100), nullable=False)
    password: Mapped[str] = mapped_column(String(72), nullable=False)
    tokens: Mapped[list['Token']] = relationship('Token', lazy='joined', back_populates='user')
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey('role.id'))
    role: Mapped['Role'] = relationship('Role', lazy='joined', back_populates='users')
    frida_logs: Mapped[list['FridaLogs']] = relationship('FridaLogs', back_populates='user')


class Token(Base):
    """Модель токена пользователя."""
    __tablename__ = 'token'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    token: Mapped[UUID] = mapped_column(CHAR(36), default=lambda: str(uuid.uuid4()), nullable=False)
    creation_time: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=now())
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('user.id'))
    user: Mapped[User] = relationship('User', lazy='joined', back_populates='tokens')


class Role(Base):
    """Модель роли пользователя."""
    __tablename__ = 'role'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    users: Mapped[list[User]] = relationship('User', lazy='joined', back_populates='role')


class FridaLogs(Base):
    """Модель логов Frida."""
    __tablename__ = 'frida_log'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('user.id'))
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=now())
    query: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str] = mapped_column(Text, nullable=False)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    user: Mapped[User] = relationship('User', back_populates='frida_logs')
    hashes: Mapped[list['LogHash']] = relationship('LogHash', back_populates='log')


class LogHash(Base):
    """Модель хэшей логов."""
    __tablename__ = 'hashs_log'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    log_id: Mapped[int] = mapped_column(Integer, ForeignKey('frida_log.id'), nullable=False)
    hash: Mapped[str] = mapped_column(String(64), nullable=False)
    log: Mapped['FridaLogs'] = relationship('FridaLogs', back_populates='hashes')


# Типы для работы с ORM
ORM_OBJECT = Union[User, Token, Role, FridaLogs, LogHash]
ORM_CLS = Union[type(User), type(Token), type(Role), type(FridaLogs), type(LogHash)]