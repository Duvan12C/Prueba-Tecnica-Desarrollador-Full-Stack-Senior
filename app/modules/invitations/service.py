from datetime import datetime, timedelta, timezone
import secrets
import hashlib

from app.modules.invitations.schemas import (
    SpaceWorkInvitationCreateRequest,
    SpaceWorkInvitationResponse
)
from app.modules.invitations.models import SpaceWorkInvitation
from app.modules.invitations.repository import SpaceWorkInvitationRepository
from app.modules.invitations.enums import InvitationStatus
from app.shared.exceptions import ConflictError, ForbiddenError, ResourceGoneError, ResourceNotFoundError


class SpaceWorkInvitationService:

    def __init__(self, repository: SpaceWorkInvitationRepository):
        self.repository = repository

    def create_invitation(
        self,
        data: SpaceWorkInvitationCreateRequest,
        invited_by_user_id: int
    ) -> SpaceWorkInvitationResponse:

        if not self.repository.can_manage_space(data.space_work_id, invited_by_user_id):
            raise ForbiddenError("No tienes permiso para invitar usuarios a este espacio")

        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        invitation = SpaceWorkInvitation(
            space_work_id=data.space_work_id,
            email=str(data.email).lower(),
            invited_user_id=self.repository.get_user_id_by_email(str(data.email).lower()),
            invited_by_user_id=invited_by_user_id,
            token_hash=token_hash,
            status=InvitationStatus.PENDING,
            expires_at=(datetime.now(timezone.utc) + timedelta(days=7)).replace(tzinfo=None)
        )

        created_invitation = self.repository.create(invitation)

        response = SpaceWorkInvitationResponse.model_validate(created_invitation)
        return response.model_copy(update={"token": token})

    def accept_invitation(self, token: str, user) -> SpaceWorkInvitationResponse:
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        invitation = self.repository.get_by_token_hash(token_hash)
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
