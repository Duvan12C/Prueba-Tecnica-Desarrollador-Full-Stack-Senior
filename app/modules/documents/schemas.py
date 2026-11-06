from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


PermissionName = Literal["read", "edit", "admin"]


class DocumentCreateRequest(BaseModel):
    space_work_id: int
    title: str = Field(min_length=1, max_length=255)
    content: str = ""
    change_summary: str | None = Field(default=None, max_length=500)


class DocumentSaveRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str
    change_summary: str | None = Field(default=None, max_length=500)


class DocumentPermissionRequest(BaseModel):
    permission: PermissionName


class DocumentPermissionResponse(BaseModel):
    document_id: int
    user_id: int
    permission: PermissionName
    assigned_by_user_id: int
    assigned_at: datetime


class DocumentResponse(BaseModel):
    id: int
    title: str
    space_work_id: int
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime | None
    current_version_number: int
    content: str


class DocumentListItem(BaseModel):
    id: int
    title: str
    space_work_id: int
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime | None
    current_version_number: int


class DocumentVersionResponse(BaseModel):
    id: int
    document_id: int
    version_number: int
    content: str
    created_by_user_id: int
    restored_from_version_id: int | None
    change_summary: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VersionCompareResponse(BaseModel):
    document_id: int
    from_version: int
    to_version: int
    unified_diff: str
