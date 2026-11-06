from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    Enum as SQLAlchemyEnum,
    func,
    text
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.modules.invitations.enums import InvitationStatus


class SpaceWorkInvitation(Base):

    __tablename__ = "space_work_invitation"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    space_work_id: Mapped[int] = mapped_column(
        ForeignKey("space_work.id"),
        nullable=False
    )

    invited_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("User.id"),
        nullable=True
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    token_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    status: Mapped[InvitationStatus] = mapped_column(
        SQLAlchemyEnum(
            InvitationStatus,
            name="invitation_status",
            native_enum=False,
            create_constraint=True,
            values_callable=lambda enum_cls: [item.value for item in enum_cls]
        ),
        nullable=False,
        default=InvitationStatus.PENDING,
        server_default=text("'Pending'")
    )

    invited_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("User.id"),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    responded_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )