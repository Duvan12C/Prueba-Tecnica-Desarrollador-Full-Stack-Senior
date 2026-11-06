from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    Boolean,
    ForeignKey,
    Integer,
    text,
    func
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Role(Base):

    __tablename__ = "role"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True
    )

    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )


class User(Base):

    __tablename__ = "User"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    rol_id: Mapped[int] = mapped_column(
        ForeignKey("role.id"),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("1")
    )