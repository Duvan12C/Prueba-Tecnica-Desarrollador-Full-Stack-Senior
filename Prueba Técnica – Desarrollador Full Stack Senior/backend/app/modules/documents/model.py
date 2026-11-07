from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    Boolean,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Document(Base):

    __tablename__ = "document"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    space_work_id: Mapped[int] = mapped_column(
        ForeignKey("space_work.id"),
        nullable=False
    )

    created_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("User.id"),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("0"),
    )

    __table_args__ = (
        UniqueConstraint(
            "id",
            "space_work_id",
            name="uq_document_id_space_work_id"
        ),

        ForeignKeyConstraint(
            ["space_work_id", "created_by_user_id"],
            ["space_work_user.space_work_id", "space_work_user.user_id"],
            name="fk_document_workspace_member"
        ),
    )
