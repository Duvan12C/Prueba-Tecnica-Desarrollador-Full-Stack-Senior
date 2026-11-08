from datetime import datetime, timedelta, timezone
import secrets
import hashlib

from app.modules.invitations.schemas import (
    ReceivedWorkspaceInvitation,
    SpaceWorkInvitationCreateRequest,
    SpaceWorkInvitationResponse,
    WorkspaceInvitationBatchRequest,
    WorkspaceInvitationCandidate,
)
from app.modules.invitations.models import SpaceWorkInvitation
from app.modules.invitations.repository import SpaceWorkInvitationRepository
from app.modules.invitations.enums import InvitationStatus
from app.modules.users.models import User
from app.shared.exceptions import ConflictError, ForbiddenError, ResourceGoneError, ResourceNotFoundError


class SpaceWorkInvitationService:

    def __init__(self, repository: SpaceWorkInvitationRepository):
        self.repository = repository

    def create_invitation(
        self,
        data: SpaceWorkInvitationCreateRequest,
        invited_by_user_id: int
    ) -> SpaceWorkInvitationResponse:

        self._require_manager(data.space_work_id, invited_by_user_id)
        recipient = self.repository.get_eligible_recipient_by_email(data.space_work_id, str(data.email).lower())
        if recipient is None:
            raise ConflictError("La cuenta no está disponible para invitar o ya tiene una invitación pendiente")

        invitation, token = self._new_invitation(data.space_work_id, invited_by_user_id, recipient)
        created_invitation = self.repository.create(invitation)

        response = SpaceWorkInvitationResponse.model_validate(created_invitation)
        return response.model_copy(update={"token": token})

    def search_candidates(self, space_work_id: int, user_id: int, query: str) -> list[WorkspaceInvitationCandidate]:
        if not self.repository.can_manage_space(space_work_id, user_id):
            raise ForbiddenError("No tienes permiso para invitar usuarios a este espacio")

        query = query.strip().lower()
        if len(query) < 2:
            return []
        users = self.repository.search_candidates(space_work_id, query)
        return [WorkspaceInvitationCandidate.model_validate(user) for user in users]

    def send_invitations(self, data: WorkspaceInvitationBatchRequest, user_id: int) -> int:
        self._require_manager(data.space_work_id, user_id)
        user_ids = set(data.user_ids)
        recipients = self.repository.get_eligible_recipients(data.space_work_id, user_ids)
        if len(recipients) != len(user_ids):
            raise ConflictError("Una o más cuentas ya pertenecen al espacio, tienen una invitación pendiente o no están disponibles")

        invitations = [self._new_invitation(data.space_work_id, user_id, recipient)[0] for recipient in recipients]
        self.repository.create_batch(invitations)
        return len(invitations)

    def list_received(self, user: User) -> list[ReceivedWorkspaceInvitation]:
        return [ReceivedWorkspaceInvitation.model_validate(row) for row in self.repository.list_received(user)]

    def accept_received_invitation(self, invitation_id: int, user: User) -> SpaceWorkInvitationResponse:
        invitation = self.repository.get_received_invitation(invitation_id, user)
        return self._accept(invitation, user)

    def accept_invitation(self, token: str, user: User) -> SpaceWorkInvitationResponse:
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        invitation = self.repository.get_by_token_hash(token_hash)
        return self._accept(invitation, user)

    def _accept(self, invitation: SpaceWorkInvitation | None, user: User) -> SpaceWorkInvitationResponse:
        if invitation is None:
            raise ResourceNotFoundError("Invitación no encontrada")
        if invitation.status != InvitationStatus.PENDING:
            raise ConflictError("La invitación ya fue respondida o cancelada")

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if invitation.expires_at <= now:
            self.repository.expire(invitation)
            raise ResourceGoneError("La invitación ha expirado")

        if invitation.email.lower() != user.email.lower():
            raise ForbiddenError("La invitación fue enviada a otro correo")
        if invitation.invited_user_id is not None and invitation.invited_user_id != user.id:
            raise ForbiddenError("La invitación está vinculada a otra cuenta")

        accepted = self.repository.accept(invitation, user)
        return SpaceWorkInvitationResponse.model_validate(accepted)

    def _require_manager(self, space_work_id: int, user_id: int) -> None:
        if not self.repository.can_manage_space(space_work_id, user_id) or not self.repository.lock_active_workspace(space_work_id):
            raise ForbiddenError("No tienes permiso para invitar usuarios a este espacio")

    @staticmethod
    def _new_invitation(space_work_id: int, invited_by_user_id: int, recipient: User) -> tuple[SpaceWorkInvitation, str]:
        token = secrets.token_urlsafe(32)
        invitation = SpaceWorkInvitation(
            space_work_id=space_work_id,
            email=recipient.email.lower(),
            invited_user_id=recipient.id,
            invited_by_user_id=invited_by_user_id,
            token_hash=hashlib.sha256(token.encode()).hexdigest(),
            status=InvitationStatus.PENDING,
            expires_at=(datetime.now(timezone.utc) + timedelta(days=7)).replace(tzinfo=None),
        )
        return invitation, token

    def list_pending_invitations(
        self,
        space_work_id: int,
        manager_user_id: int,
    ) -> list[SpaceWorkInvitationResponse]:
        if not self.repository.can_manage_space(space_work_id, manager_user_id):
            raise ResourceNotFoundError("Espacio de trabajo no encontrado")
        invitations = self.repository.list_pending(space_work_id)
        return [SpaceWorkInvitationResponse.model_validate(item) for item in invitations]

    def cancel_invitation(self, invitation_id: int, manager_user_id: int) -> SpaceWorkInvitationResponse:
        invitation = self.repository.get_by_id(invitation_id)
        if invitation is None:
            raise ResourceNotFoundError("Invitación no encontrada")
        if not self.repository.can_manage_space(invitation.space_work_id, manager_user_id):
            raise ResourceNotFoundError("Invitación no encontrada")
        if invitation.status != InvitationStatus.PENDING:
            raise ConflictError("Solo se pueden cancelar invitaciones pendientes")

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if invitation.expires_at <= now:
            self.repository.expire(invitation)
            raise ResourceGoneError("La invitación ha expirado")

        cancelled = self.repository.cancel(invitation, manager_user_id)
        return SpaceWorkInvitationResponse.model_validate(cancelled)
