from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict

from app.modules.invitations.enums import InvitationStatus


class SpaceWorkInvitationCreateRequest(BaseModel):
    space_work_id: int
    email: EmailStr


class SpaceWorkInvitationAcceptRequest(BaseModel):
    token: str


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
