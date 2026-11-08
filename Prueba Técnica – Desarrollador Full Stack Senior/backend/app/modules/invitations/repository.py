from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy import exists, func, or_, select, true, update
from sqlalchemy.engine import RowMapping

from app.modules.audit.models import AuditLog
from app.modules.invitations.enums import InvitationStatus
from app.modules.invitations.models import SpaceWorkInvitation
from app.modules.spaceswork.models import SpaceWork, SpaceWorkUser
from app.modules.users.models import User, Role
from app.shared.exceptions import ConflictError, ResourceNotFoundError


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
        self.create_batch([space_work_invitation])
        self.db.refresh(space_work_invitation)
        return space_work_invitation

    def lock_active_workspace(self, space_work_id: int) -> bool:
        statement = (
            select(SpaceWork.id)
            .where(SpaceWork.id == space_work_id, SpaceWork.is_active == true())
            .with_for_update()
            .with_hint(SpaceWork, "WITH (UPDLOCK, HOLDLOCK)", dialect_name="mssql")
        )
        return self.db.scalar(statement) is not None

    def _eligible_users(self, space_work_id: int):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        membership = exists().where(
            SpaceWorkUser.space_work_id == space_work_id,
            SpaceWorkUser.user_id == User.id,
            SpaceWorkUser.is_active == true(),
        )
        pending = exists().where(
            SpaceWorkInvitation.space_work_id == space_work_id,
            SpaceWorkInvitation.invited_user_id == User.id,
            SpaceWorkInvitation.status == InvitationStatus.PENDING,
            SpaceWorkInvitation.expires_at > now,
        )
        return select(User).where(User.is_active == true(), ~membership, ~pending)

    def search_candidates(self, space_work_id: int, query: str) -> list[User]:
        return list(self.db.scalars(
            self._eligible_users(space_work_id)
            .where(or_(
                func.lower(User.name).contains(query, autoescape=True),
                func.lower(User.email).contains(query, autoescape=True),
            ))
            .order_by(User.name, User.id)
            .limit(12)
        ).all())

    def get_eligible_recipients(self, space_work_id: int, user_ids: set[int]) -> list[User]:
        return list(self.db.scalars(
            self._eligible_users(space_work_id).where(User.id.in_(user_ids))
        ).all())

    def get_eligible_recipient_by_email(self, space_work_id: int, email: str) -> User | None:
        return self.db.scalar(self._eligible_users(space_work_id).where(func.lower(User.email) == email))

    def create_batch(self, invitations: list[SpaceWorkInvitation]) -> None:
        try:
            self.db.add_all(invitations)
            self.db.flush()
            self.db.add_all([
                AuditLog(
                    user_id=invitation.invited_by_user_id,
                    space_work_id=invitation.space_work_id,
                    action="invitation.created",
                    entity_type="space_work_invitation",
                    entity_id=invitation.id,
                    description="Invitación al espacio de trabajo creada",
                    new_values=invitation.email,
                )
                for invitation in invitations
            ])
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def _received_by(self, user: User):
        return select(SpaceWorkInvitation).join(SpaceWork, SpaceWork.id == SpaceWorkInvitation.space_work_id).where(
            SpaceWorkInvitation.invited_user_id == user.id,
            func.lower(SpaceWorkInvitation.email) == user.email.lower(),
            SpaceWork.is_active == true(),
        )

    def get_received_invitation(self, invitation_id: int, user: User) -> SpaceWorkInvitation | None:
        return self.db.scalar(self._received_by(user).where(SpaceWorkInvitation.id == invitation_id))

    def list_received(self, user: User) -> list[RowMapping]:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        statement = (
            self._received_by(user)
            .join(User, User.id == SpaceWorkInvitation.invited_by_user_id)
            .with_only_columns(
                SpaceWorkInvitation.id,
                SpaceWorkInvitation.space_work_id,
                SpaceWork.name.label("workspace_name"),
                User.name.label("inviter_name"),
                SpaceWorkInvitation.expires_at,
            )
            .where(SpaceWorkInvitation.status == InvitationStatus.PENDING, SpaceWorkInvitation.expires_at > now)
            .order_by(SpaceWorkInvitation.created_at.desc(), SpaceWorkInvitation.id.desc())
        )
        return list(self.db.execute(statement).mappings().all())

    def get_by_token_hash(self, token_hash: str) -> SpaceWorkInvitation | None:
        return self.db.scalar(
            select(SpaceWorkInvitation).where(SpaceWorkInvitation.token_hash == token_hash)
        )

    def get_by_id(self, invitation_id: int) -> SpaceWorkInvitation | None:
        return self.db.get(SpaceWorkInvitation, invitation_id)

    def list_pending(self, space_work_id: int) -> list[SpaceWorkInvitation]:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        statement = (
            select(SpaceWorkInvitation)
            .where(
                SpaceWorkInvitation.space_work_id == space_work_id,
                SpaceWorkInvitation.status == InvitationStatus.PENDING,
                SpaceWorkInvitation.expires_at > now,
            )
            .order_by(SpaceWorkInvitation.created_at.desc(), SpaceWorkInvitation.id.desc())
        )
        return list(self.db.scalars(statement).all())

    def get_membership(self, space_work_id: int, user_id: int) -> SpaceWorkUser | None:
        return self.db.scalar(select(SpaceWorkUser).where(
            SpaceWorkUser.space_work_id == space_work_id,
            SpaceWorkUser.user_id == user_id,
        ))

    def expire(self, invitation: SpaceWorkInvitation) -> None:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        self.db.execute(
            update(SpaceWorkInvitation)
            .where(
                SpaceWorkInvitation.id == invitation.id,
                SpaceWorkInvitation.status == InvitationStatus.PENDING,
                SpaceWorkInvitation.expires_at <= now,
            )
            .values(status=InvitationStatus.EXPIRED, responded_at=now)
        )
        self.db.commit()

    def cancel(self, invitation: SpaceWorkInvitation, cancelled_by_user_id: int) -> SpaceWorkInvitation:
        try:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            self._respond(invitation.id, InvitationStatus.CANCELLED, now)
            self.db.add(AuditLog(
                user_id=cancelled_by_user_id,
                space_work_id=invitation.space_work_id,
                action="invitation.cancelled",
                entity_type="space_work_invitation",
                entity_id=invitation.id,
                description="Invitación pendiente cancelada por el Gestor",
                old_values=InvitationStatus.PENDING.value,
                new_values=InvitationStatus.CANCELLED.value,
            ))
            self.db.commit()
            self.db.refresh(invitation)
            return invitation
        except Exception:
            self.db.rollback()
            raise

    def accept(self, invitation: SpaceWorkInvitation, user: User) -> SpaceWorkInvitation:
        try:
            if not self.lock_active_workspace(invitation.space_work_id):
                raise ResourceNotFoundError("El espacio de trabajo no está disponible")
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            self._respond(invitation.id, InvitationStatus.ACCEPTED, now, invited_user_id=user.id)
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

    def _respond(self, invitation_id: int, status: InvitationStatus, now: datetime, **fields) -> None:
        result = self.db.execute(
            update(SpaceWorkInvitation)
            .where(
                SpaceWorkInvitation.id == invitation_id,
                SpaceWorkInvitation.status == InvitationStatus.PENDING,
                SpaceWorkInvitation.expires_at > now,
            )
            .values(status=status, responded_at=now, **fields)
        )
        if result.rowcount != 1:
            raise ConflictError("La invitación ya no está pendiente o ha expirado")
