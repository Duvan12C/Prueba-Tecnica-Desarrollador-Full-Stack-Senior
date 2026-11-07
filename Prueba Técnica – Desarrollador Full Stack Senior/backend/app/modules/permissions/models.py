from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    Integer,
    UniqueConstraint,
    ForeignKeyConstraint
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Permission(Base):

    __tablename__ = "permission"

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


class PermissionDocumentUser(Base):

    __tablename__ = "permission_document_user"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    document_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    space_work_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    permission_id: Mapped[int] = mapped_column(
        ForeignKey("permission.id"),
        nullable=False
    )

    assigned_by_user_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    assigned_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "document_id",
            "user_id",
            name="uq_permission_document_user"
        ),

        ForeignKeyConstraint(
            ["document_id", "space_work_id"],
            ["document.id", "document.space_work_id"],
            name="fk_permission_document_workspace"
        ),

        ForeignKeyConstraint(
            ["space_work_id", "user_id"],
            ["space_work_user.space_work_id", "space_work_user.user_id"],
            name="fk_permission_document_user_workspace"
        ),

        ForeignKeyConstraint(
            ["space_work_id", "assigned_by_user_id"],
            ["space_work_user.space_work_id", "space_work_user.user_id"],
            name="fk_permission_assigned_by_workspace"
        ),
    )