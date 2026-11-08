from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints

from app.modules.spaceswork.appearance import WorkspaceColor, WorkspaceIcon


class SpaceWorkCreateRequest(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)] = Field(
        description="Nombre del espacio de trabajo"
    )
    description: str | None = Field(default=None, description="Descripción opcional del espacio")
    icon_key: WorkspaceIcon = WorkspaceIcon.FOLDER
    color_key: WorkspaceColor = WorkspaceColor.BLUE


class SpaceWorkMemberSummary(BaseModel):
    count: int
    names: list[str]


class SpaceWorkResponse(BaseModel):
    id: int
    name: str
    description: str | None
    icon_key: WorkspaceIcon
    color_key: WorkspaceColor
    owner_user_id: int
    member_summary: SpaceWorkMemberSummary | None = None

    model_config = ConfigDict(from_attributes=True)


class SpaceWorkCapabilities(BaseModel):
    can_create: bool


class SpaceWorkMemberResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    role_name: str
    joined_at: datetime
