from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.documents.schemas import PermissionName


class AuthenticateMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["authenticate"]
    token: str = Field(min_length=1, max_length=4096)


class EditMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["edit"]
    request_id: str = Field(min_length=1, max_length=64)
    base_version: int = Field(gt=0, strict=True)
    content: str = Field(max_length=250_000)


class Participant(BaseModel):
    user_id: int
    name: str


class DocumentSnapshot(BaseModel):
    version: int
    content: str
    permission: PermissionName
