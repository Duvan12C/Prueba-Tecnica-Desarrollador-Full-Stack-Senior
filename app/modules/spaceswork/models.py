from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    Boolean,
    ForeignKey,
    Text,
    func,
    Integer,
    UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SpaceWork(Base):

    __tablename__ = "space_work"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    owner_user_id: Mapped[int] = mapped_column(
        ForeignKey("User.id"),
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
        server_default="1"
    )


class SpaceWorkUser(Base):

    __tablename__ = "space_work_user"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    space_work_id: Mapped[int] = mapped_column(
        ForeignKey("space_work.id"),
        nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("User.id"),
        nullable=False
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="1"
    )

    removed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    __table_args__ = (
        UniqueConstraint(
            "space_work_id",
            "user_id",
            name="uq_space_work_user"
        ),
    )
