from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


PermissionName = Literal["read", "edit", "admin"]


class DocumentCreateRequest(BaseModel):
    space_work_id: int = Field(gt=0, description="Espacio donde se creará el documento")
    title: str = Field(min_length=1, max_length=255, description="Título del documento")
    content: str = Field(default="", description="Contenido de la versión inicial")
    change_summary: str | None = Field(default=None, max_length=500, description="Resumen de la creación")


class DocumentSaveRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255, description="Título nuevo opcional")
    content: str = Field(description="Contenido que se guardará como una versión nueva")
    change_summary: str | None = Field(default=None, max_length=500, description="Resumen del cambio")


class DocumentPermissionRequest(BaseModel):
    permission: PermissionName = Field(description="Nivel documental: read, edit o admin")


class DocumentPermissionResponse(BaseModel):
    document_id: int
    user_id: int
    permission: PermissionName
    assigned_by_user_id: int
    assigned_at: datetime


class DocumentMemberAccessResponse(BaseModel):
    user_id: int
    name: str
    email: str
    permission: PermissionName | None
    is_owner: bool


class DocumentResponse(BaseModel):
    id: int
    title: str
    space_work_id: int
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime | None
    current_version_number: int
    content: str
    permission: PermissionName


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
