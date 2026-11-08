from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints


class SpaceWorkCreateRequest(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)] = Field(
        description="Nombre del espacio de trabajo"
    )
    description: str | None = Field(default=None, description="Descripción opcional del espacio")


class SpaceWorkResponse(BaseModel):
    id: int
    name: str
    description: str | None
    owner_user_id: int

    model_config = ConfigDict(from_attributes=True)


class SpaceWorkCapabilities(BaseModel):
    can_create: bool


class SpaceWorkMemberResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    role_name: str
    joined_at: datetime
