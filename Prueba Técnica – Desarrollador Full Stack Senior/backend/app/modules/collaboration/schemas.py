from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter

from app.modules.documents.schemas import PermissionName


class AuthenticateMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["authenticate"]
    token: str = Field(min_length=1, max_length=4096)


class EditMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["edit"]
    request_id: str = Field(min_length=1, max_length=64)
    base_revision: int = Field(gt=0, strict=True)
    content: str = Field(max_length=250_000)


class SaveVersionMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["save_version"]
    request_id: str = Field(min_length=1, max_length=64)
    base_revision: int = Field(gt=0, strict=True)


collaboration_message = TypeAdapter(Annotated[EditMessage | SaveVersionMessage, Field(discriminator="type")])


class Participant(BaseModel):
    user_id: int
    name: str


class DocumentSnapshot(BaseModel):
    version: int
    revision: int
    content: str
    permission: PermissionName
    has_unpublished_changes: bool


class VersionActivity(BaseModel):
    type: Literal["version_activity"] = "version_activity"
    status: Literal["saving", "saved", "cancelled"]
    name: str
    version: int | None = None
