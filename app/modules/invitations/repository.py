from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy import select, true

from app.modules.audit.models import AuditLog
from app.modules.invitations.enums import InvitationStatus
from app.modules.invitations.models import SpaceWorkInvitation
from app.modules.spaceswork.models import SpaceWork, SpaceWorkUser
from app.modules.users.models import User, Role


class SpaceWorkInvitationRepository:

    def __init__(self, db: Session):
        self.db = db

    def can_manage_space(self, space_work_id: int, user_id: int) -> bool:
        statement = (
            select(SpaceWork.id)
            .join(User, User.id == SpaceWork.owner_user_id)
            .join(Role, Role.id == User.rol_id)
            .join(
                SpaceWorkUser,
                (SpaceWorkUser.space_work_id == SpaceWork.id)
                & (SpaceWorkUser.user_id == User.id),
            )
            .where(
                SpaceWork.id == space_work_id,
                SpaceWork.owner_user_id == user_id,
                SpaceWork.is_active == true(),
                SpaceWorkUser.is_active == true(),
                User.is_active == true(),
                Role.name == "Gestor",
            )
        )
        return self.db.scalar(statement) is not None

    def create(self, space_work_invitation: SpaceWorkInvitation) -> SpaceWorkInvitation:
        try:
            self.db.add(space_work_invitation)
            self.db.flush()
            self.db.add(AuditLog(
                user_id=space_work_invitation.invited_by_user_id,
                space_work_id=space_work_invitation.space_work_id,
                action="invitation.created",
                entity_type="space_work_invitation",
                entity_id=space_work_invitation.id,
                description="Invitación al espacio de trabajo creada",
                new_values=space_work_invitation.email,
            ))
            self.db.commit()
            self.db.refresh(space_work_invitation)

            return space_work_invitation

        except Exception:
            self.db.rollback()
            raise

    def get_user_id_by_email(self, email: str) -> int | None:
        return self.db.scalar(select(User.id).where(User.email == email))

    def get_by_token_hash(self, token_hash: str) -> SpaceWorkInvitation | None:
        return self.db.scalar(
            select(SpaceWorkInvitation).where(SpaceWorkInvitation.token_hash == token_hash)
        )

    def get_membership(self, space_work_id: int, user_id: int) -> SpaceWorkUser | None:
        return self.db.scalar(select(SpaceWorkUser).where(
            SpaceWorkUser.space_work_id == space_work_id,
            SpaceWorkUser.user_id == user_id,
        ))

    def expire(self, invitation: SpaceWorkInvitation) -> None:
        invitation.status = InvitationStatus.EXPIRED
        invitation.responded_at = datetime.now(timezone.utc).replace(tzinfo=None)
        self.db.commit()

    def accept(self, invitation: SpaceWorkInvitation, user: User) -> SpaceWorkInvitation:
        try:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            membership = self.get_membership(invitation.space_work_id, user.id)
            if membership is None:
                self.db.add(SpaceWorkUser(
                    space_work_id=invitation.space_work_id,
                    user_id=user.id,
                    joined_at=now,
                    is_active=True,
                ))
            else:
                membership.is_active = True
                membership.joined_at = now
                membership.removed_at = None

            invitation.invited_user_id = user.id
            invitation.status = InvitationStatus.ACCEPTED
            invitation.responded_at = now
            self.db.add(AuditLog(
                user_id=user.id,
                space_work_id=invitation.space_work_id,
                action="invitation.accepted",
                entity_type="space_work_invitation",
                entity_id=invitation.id,
                description="El usuario aceptó la invitación y se agregó al espacio",
                new_values=user.email,
            ))
            self.db.commit()
            self.db.refresh(invitation)
            return invitation
        except Exception:
            self.db.rollback()
            raise
