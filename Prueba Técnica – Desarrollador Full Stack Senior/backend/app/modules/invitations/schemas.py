from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, Field, PositiveInt

from app.modules.invitations.enums import InvitationStatus


class SpaceWorkInvitationCreateRequest(BaseModel):
    space_work_id: int = Field(gt=0, description="Identificador del espacio al que se invita")
    email: EmailStr = Field(description="Correo de la persona invitada")


class SpaceWorkInvitationAcceptRequest(BaseModel):
    token: str = Field(min_length=1, description="Token recibido en la respuesta de creación de invitación")


class WorkspaceInvitationBatchRequest(BaseModel):
    space_work_id: PositiveInt
    user_ids: list[PositiveInt] = Field(min_length=1, max_length=20)


class WorkspaceInvitationBatchResponse(BaseModel):
    sent_count: int


class WorkspaceInvitationCandidate(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class ReceivedWorkspaceInvitation(BaseModel):
    id: int
    space_work_id: int
    workspace_name: str
    inviter_name: str
    expires_at: datetime


class SpaceWorkInvitationResponse(BaseModel):
    id: int
    space_work_id: int
    invited_user_id: int | None
    email: EmailStr
    status: InvitationStatus
    invited_by_user_id: int
    created_at: datetime
    expires_at: datetime
    responded_at: datetime | None
    token: str | None = None

    model_config = ConfigDict(from_attributes=True)
