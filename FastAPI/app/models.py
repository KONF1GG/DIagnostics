import datetime
import uuid
from uuid import UUID

from sqlalchemy import Integer, String, ForeignKey, UUID, func, DateTime, CHAR
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.config import DSN, RADIUS_DSN

engine = create_async_engine(
    DSN,
)

redius_engine = create_async_engine(
    RADIUS_DSN,
)

SessionRedius = async_sessionmaker(bind=redius_engine, expire_on_commit=False)
Session = async_sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = 'user'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(72), nullable=False)
    tokens: Mapped[list['Token']] = relationship('Token', lazy='joined', back_populates='user')
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey('role.id'))
    role: Mapped['Role'] = relationship('Role', lazy='joined', back_populates='users')


class Token(Base):
    __tablename__ = 'token'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    token: Mapped[UUID] = mapped_column(CHAR(36), default=lambda: str(uuid.uuid4()), nullable=False)
    creation_time: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now())
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('user.id'))
    user: Mapped[User] = relationship('User', lazy='joined', back_populates='tokens')


class Role(Base):
    __tablename__ = 'role'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    users: Mapped[list[User]] = relationship('User', lazy='joined', back_populates='role')


ORM_OBJECT = User | Token | Role
ORM_CLS = type(User) | type(Token) | type(Role)
