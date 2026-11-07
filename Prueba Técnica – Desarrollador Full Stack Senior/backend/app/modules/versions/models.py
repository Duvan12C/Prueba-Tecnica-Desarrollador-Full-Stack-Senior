from datetime import datetime

from sqlalchemy import (
    Integer,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    String,
    Text,
    UniqueConstraint,
    func
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DocumentVersion(Base):

    __tablename__ = "document_version"

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

    version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    created_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("User.id"),
        nullable=False
    )

    restored_from_version_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    change_summary: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "document_id",
            "version_number",
            name="uq_document_version_number"
        ),

        UniqueConstraint(
            "id",
            "document_id",
            name="uq_document_version_id_document"
        ),

        ForeignKeyConstraint(
            ["document_id", "space_work_id"],
            ["document.id", "document.space_work_id"],
            name="fk_document_version_document_workspace"
        ),

        ForeignKeyConstraint(
            ["restored_from_version_id", "document_id"],
            ["document_version.id", "document_version.document_id"],
            name="fk_document_version_restored_from"
        ),

        ForeignKeyConstraint(
            ["space_work_id", "created_by_user_id"],
            ["space_work_user.space_work_id", "space_work_user.user_id"],
            name="fk_document_version_workspace_member"
        ),
    )