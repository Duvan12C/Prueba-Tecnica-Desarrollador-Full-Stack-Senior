import json
from datetime import datetime, timezone

from sqlalchemy import and_, exists, false, or_, select, true
from sqlalchemy.orm import Session

from app.modules.audit.models import AuditLog
from app.modules.documents.model import Document
from app.modules.permissions.models import Permission, PermissionDocumentUser
from app.modules.spaceswork.models import SpaceWork, SpaceWorkUser
from app.modules.users.models import Role, User
from app.modules.versions.models import DocumentVersion
from app.shared.exceptions import BadRequestError, ConflictError, ResourceNotFoundError


def utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def is_space_manager(self, space_work_id: int, user_id: int) -> bool:
        statement = (
            select(SpaceWork.id)
            .join(User, User.id == SpaceWork.owner_user_id)
            .join(Role, Role.id == User.rol_id)
            .where(
                SpaceWork.id == space_work_id,
                SpaceWork.is_active == true(),
                SpaceWork.owner_user_id == user_id,
                User.is_active == true(),
                Role.name == "Gestor",
            )
        )
        return self.db.scalar(statement) is not None

    def get_document(self, document_id: int) -> Document | None:
        statement = select(Document).where(
            Document.id == document_id,
            Document.is_deleted == false(),
        )
        return self.db.scalar(statement)

    def get_access_level(self, document: Document, user_id: int) -> str | None:
        if self.is_space_manager(document.space_work_id, user_id):
            return "admin"

        statement = (
            select(Permission.name)
            .join(
                PermissionDocumentUser,
                PermissionDocumentUser.permission_id == Permission.id,
            )
            .join(
                SpaceWorkUser,
                and_(
                    SpaceWorkUser.space_work_id == PermissionDocumentUser.space_work_id,
                    SpaceWorkUser.user_id == PermissionDocumentUser.user_id,
                ),
            )
            .where(
                PermissionDocumentUser.document_id == document.id,
                PermissionDocumentUser.space_work_id == document.space_work_id,
                PermissionDocumentUser.user_id == user_id,
                SpaceWorkUser.is_active == true(),
            )
        )
        return self.db.scalar(statement)

    def list_for_user(self, space_work_id: int, user_id: int) -> list[Document]:
        manager_access = exists(
            select(SpaceWork.id)
            .join(User, User.id == SpaceWork.owner_user_id)
            .join(Role, Role.id == User.rol_id)
            .where(
                SpaceWork.id == Document.space_work_id,
                SpaceWork.owner_user_id == user_id,
                SpaceWork.is_active == true(),
                User.is_active == true(),
                Role.name == "Gestor",
            )
        )
        permission_access = exists(
            select(PermissionDocumentUser.id)
            .join(
                SpaceWorkUser,
                and_(
                    SpaceWorkUser.space_work_id == PermissionDocumentUser.space_work_id,
                    SpaceWorkUser.user_id == PermissionDocumentUser.user_id,
                ),
            )
            .where(
                PermissionDocumentUser.document_id == Document.id,
                PermissionDocumentUser.space_work_id == Document.space_work_id,
                PermissionDocumentUser.user_id == user_id,
                SpaceWorkUser.is_active == true(),
            )
        )
        statement = (
            select(Document)
            .where(
                Document.space_work_id == space_work_id,
                Document.is_deleted == false(),
                or_(manager_access, permission_access),
            )
            .order_by(Document.updated_at.desc(), Document.created_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def latest_version(self, document_id: int) -> DocumentVersion | None:
        statement = (
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.version_number.desc())
            .limit(1)
        )
        return self.db.scalar(statement)

    def get_version(self, document_id: int, version_number: int) -> DocumentVersion | None:
        statement = select(DocumentVersion).where(
            DocumentVersion.document_id == document_id,
            DocumentVersion.version_number == version_number,
        )
        return self.db.scalar(statement)

    def list_versions(self, document_id: int) -> list[DocumentVersion]:
        statement = (
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.version_number.desc())
        )
        return list(self.db.scalars(statement).all())

    def create_document(
        self,
        *,
        space_work_id: int,
        title: str,
        content: str,
        user_id: int,
        change_summary: str | None,
    ) -> tuple[Document, DocumentVersion]:
        try:
            document = Document(
                title=title.strip(),
                space_work_id=space_work_id,
                created_by_user_id=user_id,
            )
            self.db.add(document)
            self.db.flush()

            version = DocumentVersion(
                document_id=document.id,
                space_work_id=space_work_id,
                version_number=1,
                content=content,
                created_by_user_id=user_id,
                change_summary=change_summary or "Creación del documento",
            )
            self.db.add(version)
            self.db.add(AuditLog(
                user_id=user_id,
                space_work_id=space_work_id,
                action="document.created",
                entity_type="document",
                entity_id=document.id,
                description="Documento y versión inicial creados",
                new_values=json.dumps({"title": document.title, "version": 1}, ensure_ascii=False),
            ))
            self.db.commit()
            self.db.refresh(document)
            self.db.refresh(version)
            return document, version
        except Exception:
            self.db.rollback()
            raise

    def append_version(
        self,
        *,
        document: Document,
        content: str,
        user_id: int,
        change_summary: str | None,
        restored_from_version_id: int | None = None,
        title: str | None = None,
    ) -> DocumentVersion:
        try:
            latest = self.latest_version(document.id)
            if latest is None:
                raise ConflictError("El documento no tiene una versión inicial")

            old_title = document.title
            if title is not None:
                document.title = title.strip()
            document.updated_at = utc_now_naive()

            version = DocumentVersion(
                document_id=document.id,
                space_work_id=document.space_work_id,
                version_number=latest.version_number + 1,
                content=content,
                created_by_user_id=user_id,
                restored_from_version_id=restored_from_version_id,
                change_summary=change_summary or (
                    f"Restauración de versión" if restored_from_version_id else "Edición del documento"
                ),
            )
            self.db.add(version)
            self.db.add(AuditLog(
                user_id=user_id,
                space_work_id=document.space_work_id,
                action="document.restored" if restored_from_version_id else "document.updated",
                entity_type="document",
                entity_id=document.id,
                description="Nueva versión agregada al historial",
                old_values=json.dumps({"title": old_title, "version": latest.version_number}, ensure_ascii=False),
                new_values=json.dumps({"title": document.title, "version": latest.version_number + 1}, ensure_ascii=False),
            ))
            self.db.commit()
            self.db.refresh(version)
            return version
        except Exception:
            self.db.rollback()
            raise

    def set_permission(
        self,
        *,
        document: Document,
        target_user_id: int,
        permission_name: str,
        assigned_by_user_id: int,
    ) -> PermissionDocumentUser:
        try:
            permission = self.db.scalar(select(Permission).where(Permission.name == permission_name))
            if permission is None:
                raise BadRequestError("El nivel de permiso no está configurado. Ejecuta las migraciones.")

            statement = select(SpaceWorkUser.id).where(
                SpaceWorkUser.space_work_id == document.space_work_id,
                SpaceWorkUser.user_id == target_user_id,
                SpaceWorkUser.is_active == true(),
            )
            if self.db.scalar(statement) is None:
                raise BadRequestError("El usuario no pertenece al espacio de trabajo activo")

            assignment = self.db.scalar(select(PermissionDocumentUser).where(
                PermissionDocumentUser.document_id == document.id,
                PermissionDocumentUser.user_id == target_user_id,
            ))
            old_permission_id = assignment.permission_id if assignment else None
            if assignment is None:
                assignment = PermissionDocumentUser(
                    document_id=document.id,
                    space_work_id=document.space_work_id,
                    user_id=target_user_id,
                    permission_id=permission.id,
                    assigned_by_user_id=assigned_by_user_id,
                    assigned_at=utc_now_naive(),
                )
                self.db.add(assignment)
            else:
                assignment.permission_id = permission.id
                assignment.assigned_by_user_id = assigned_by_user_id
                assignment.assigned_at = utc_now_naive()

            self.db.add(AuditLog(
                user_id=assigned_by_user_id,
                space_work_id=document.space_work_id,
                action="document.permission_changed",
                entity_type="document",
                entity_id=document.id,
                description="Permiso de documento asignado o actualizado",
                old_values=json.dumps({"permission_id": old_permission_id}),
                new_values=json.dumps({"user_id": target_user_id, "permission": permission_name}),
            ))
            self.db.commit()
            self.db.refresh(assignment)
            return assignment
        except Exception:
            self.db.rollback()
            raise

    def revoke_permission(
        self,
        *,
        document: Document,
        target_user_id: int,
        revoked_by_user_id: int,
    ) -> None:
        try:
            assignment = self.db.scalar(select(PermissionDocumentUser).where(
                PermissionDocumentUser.document_id == document.id,
                PermissionDocumentUser.space_work_id == document.space_work_id,
                PermissionDocumentUser.user_id == target_user_id,
            ))
            if assignment is None:
                raise ResourceNotFoundError("El usuario no tiene un permiso asignado en este documento")

            permission_name = self.db.scalar(
                select(Permission.name).where(Permission.id == assignment.permission_id)
            )
            self.db.delete(assignment)
            self.db.add(AuditLog(
                user_id=revoked_by_user_id,
                space_work_id=document.space_work_id,
                action="document.permission_revoked",
                entity_type="document",
                entity_id=document.id,
                description="Permiso documental revocado",
                old_values=json.dumps({"user_id": target_user_id, "permission": permission_name}),
                new_values=json.dumps({"user_id": target_user_id, "permission": None}),
            ))
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def soft_delete_document(self, document: Document, user_id: int) -> None:
        try:
            document.is_deleted = True
            document.updated_at = utc_now_naive()
            self.db.add(AuditLog(
                user_id=user_id,
                space_work_id=document.space_work_id,
                action="document.deleted",
                entity_type="document",
                entity_id=document.id,
                description="Documento eliminado lógicamente; su historial se conserva",
                old_values=json.dumps({"is_deleted": False}),
                new_values=json.dumps({"is_deleted": True}),
            ))
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
