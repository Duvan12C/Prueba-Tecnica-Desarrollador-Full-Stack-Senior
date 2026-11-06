import difflib

from app.modules.documents.repository import DocumentRepository
from app.modules.documents.schemas import (
    DocumentCreateRequest,
    DocumentPermissionRequest,
    DocumentSaveRequest,
)
from app.shared.exceptions import BadRequestError, ForbiddenError, ResourceNotFoundError


class DocumentService:
    def __init__(self, repository: DocumentRepository):
        self.repository = repository

    def create(self, data: DocumentCreateRequest, user_id: int):
        if not self.repository.is_space_manager(data.space_work_id, user_id):
            raise ForbiddenError("Solo el Gestor propietario puede crear documentos en este espacio")
        return self.repository.create_document(
            space_work_id=data.space_work_id,
            title=data.title,
            content=data.content,
            user_id=user_id,
            change_summary=data.change_summary,
        )

    def get_readable_document(self, document_id: int, user_id: int):
        document = self.repository.get_document(document_id)
        if document is None:
            raise ResourceNotFoundError("Documento no encontrado")
        permission = self.repository.get_access_level(document, user_id)
        if permission not in {"read", "edit", "admin"}:
            raise ResourceNotFoundError("Documento no encontrado")
        return document, permission

    def save(self, document_id: int, data: DocumentSaveRequest, user_id: int):
        document, permission = self.get_readable_document(document_id, user_id)
        if permission not in {"edit", "admin"}:
            raise ForbiddenError("No tienes permiso de edición para este documento")
        return self.repository.append_version(
            document=document,
            content=data.content,
            user_id=user_id,
            change_summary=data.change_summary,
            title=data.title,
        )

    def restore(self, document_id: int, version_number: int, user_id: int):
        document, permission = self.get_readable_document(document_id, user_id)
        if permission not in {"edit", "admin"}:
            raise ForbiddenError("No tienes permiso para restaurar este documento")
        source = self.repository.get_version(document_id, version_number)
        if source is None:
            raise ResourceNotFoundError("Versión no encontrada")
        return self.repository.append_version(
            document=document,
            content=source.content,
            user_id=user_id,
            change_summary=f"Restaurada desde la versión {source.version_number}",
            restored_from_version_id=source.id,
        )

    def compare(self, document_id: int, from_version: int, to_version: int, user_id: int) -> str:
        self.get_readable_document(document_id, user_id)
        left = self.repository.get_version(document_id, from_version)
        right = self.repository.get_version(document_id, to_version)
        if left is None or right is None:
            raise ResourceNotFoundError("Una de las versiones no existe")
        return "".join(difflib.unified_diff(
            left.content.splitlines(keepends=True),
            right.content.splitlines(keepends=True),
            fromfile=f"versión-{from_version}",
            tofile=f"versión-{to_version}",
        ))

    def assign_permission(
        self,
        document_id: int,
        target_user_id: int,
        data: DocumentPermissionRequest,
        actor_user_id: int,
    ):
        document = self.repository.get_document(document_id)
        if document is None:
            raise ResourceNotFoundError("Documento no encontrado")
        actor_permission = self.repository.get_access_level(document, actor_user_id)
        if actor_permission != "admin":
            raise ForbiddenError("Necesitas permiso admin en este documento para gestionar sus permisos")
        return self.repository.set_permission(
            document=document,
            target_user_id=target_user_id,
            permission_name=data.permission,
            assigned_by_user_id=actor_user_id,
        )

    def delete(self, document_id: int, user_id: int) -> None:
        document = self.repository.get_document(document_id)
        if document is None:
            raise ResourceNotFoundError("Documento no encontrado")
        if not self.repository.is_space_manager(document.space_work_id, user_id):
            raise ForbiddenError("Solo el Gestor propietario puede eliminar documentos")
        self.repository.soft_delete_document(document, user_id)
