import json
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.modules.spaceswork.models import SpaceWork, SpaceWorkUser
from app.modules.users.models import User, Role
from sqlalchemy import and_, exists, false, or_, select, true

from app.modules.audit.models import AuditLog
from app.modules.documents.model import Document
from app.modules.permissions.models import Permission, PermissionDocumentUser
from app.shared.exceptions import ConflictError, ResourceNotFoundError

class SpaceWorkRepository:

    def __init__(self, db: Session):
        self.db = db

    def is_manager(self, user_id: int) -> bool:
        statement = (
            select(User.id)
            .join(Role, Role.id == User.rol_id)
            .where(User.id == user_id, User.is_active == true(), Role.name == "Gestor")
        )
        return self.db.scalar(statement) is not None

    def is_manager_of_space(self, space_work_id: int, user_id: int) -> bool:
        statement = (
            select(SpaceWork.id)
            .join(User, User.id == SpaceWork.owner_user_id)
            .join(Role, Role.id == User.rol_id)
            .where(
                SpaceWork.id == space_work_id,
                SpaceWork.owner_user_id == user_id,
                SpaceWork.is_active == true(),
                User.is_active == true(),
                Role.name == "Gestor",
            )
        )
        return self.db.scalar(statement) is not None

    def list_for_user(self, user_id: int) -> list[SpaceWork]:
        membership = exists(
            select(SpaceWorkUser.id).where(
                SpaceWorkUser.space_work_id == SpaceWork.id,
                SpaceWorkUser.user_id == user_id,
                SpaceWorkUser.is_active == true(),
            )
        )
        statement = (
            select(SpaceWork)
            .where(
                SpaceWork.is_active == true(),
                or_(SpaceWork.owner_user_id == user_id, membership),
            )
            .order_by(SpaceWork.created_at.desc(), SpaceWork.id.desc())
        )
        return list(self.db.scalars(statement).all())

    def can_view_members(self, space_work_id: int, user_id: int) -> bool:
        manager = (
            select(SpaceWork.id)
            .join(User, User.id == SpaceWork.owner_user_id)
            .join(Role, Role.id == User.rol_id)
            .where(
                SpaceWork.id == space_work_id,
                SpaceWork.owner_user_id == user_id,
                SpaceWork.is_active == true(),
                User.is_active == true(),
                Role.name == "Gestor",
            )
        )
        if self.db.scalar(manager) is not None:
            return True

        admin_document = (
            select(PermissionDocumentUser.id)
            .join(Permission, Permission.id == PermissionDocumentUser.permission_id)
            .join(Document, Document.id == PermissionDocumentUser.document_id)
            .join(
                SpaceWorkUser,
                and_(
                    SpaceWorkUser.space_work_id == PermissionDocumentUser.space_work_id,
                    SpaceWorkUser.user_id == PermissionDocumentUser.user_id,
                ),
            )
            .join(SpaceWork, SpaceWork.id == PermissionDocumentUser.space_work_id)
            .where(
                PermissionDocumentUser.space_work_id == space_work_id,
                PermissionDocumentUser.user_id == user_id,
                Permission.name == "admin",
                Document.is_deleted == false(),
                SpaceWorkUser.is_active == true(),
                SpaceWork.is_active == true(),
            )
        )
        return self.db.scalar(admin_document) is not None

    def list_active_members(self, space_work_id: int) -> list[tuple[User, Role, SpaceWorkUser]]:
        statement = (
            select(User, Role, SpaceWorkUser)
            .join(Role, Role.id == User.rol_id)
            .join(SpaceWorkUser, SpaceWorkUser.user_id == User.id)
            .where(
                SpaceWorkUser.space_work_id == space_work_id,
                SpaceWorkUser.is_active == true(),
                User.is_active == true(),
            )
            .order_by(User.name, User.id)
        )
        return list(self.db.execute(statement).all())

    def remove_member(self, space_work_id: int, member_user_id: int, removed_by_user_id: int) -> None:
        try:
            space = self.db.get(SpaceWork, space_work_id)
            if space is None or not space.is_active:
                raise ResourceNotFoundError("Espacio de trabajo no encontrado")
            if space.owner_user_id == member_user_id:
                raise ConflictError("No se puede retirar al Gestor propietario del espacio")

            membership = self.db.scalar(select(SpaceWorkUser).where(
                SpaceWorkUser.space_work_id == space_work_id,
                SpaceWorkUser.user_id == member_user_id,
                SpaceWorkUser.is_active == true(),
            ))
            if membership is None:
                raise ResourceNotFoundError("Miembro activo no encontrado en este espacio")

            assignments = list(self.db.scalars(select(PermissionDocumentUser).where(
                PermissionDocumentUser.space_work_id == space_work_id,
                PermissionDocumentUser.user_id == member_user_id,
            )).all())
            for assignment in assignments:
                self.db.delete(assignment)

            now = datetime.now(timezone.utc).replace(tzinfo=None)
            membership.is_active = False
            membership.removed_at = now
            self.db.add(AuditLog(
                user_id=removed_by_user_id,
                space_work_id=space_work_id,
                action="space_work.member_removed",
                entity_type="space_work_user",
                entity_id=membership.id,
                description="Miembro retirado del espacio y accesos documentales revocados",
                old_values=json.dumps({"user_id": member_user_id, "is_active": True}),
                new_values=json.dumps({
                    "user_id": member_user_id,
                    "is_active": False,
                    "revoked_document_permissions": len(assignments),
                }),
            ))
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def create_for_owner(self, space_work: SpaceWork) -> SpaceWork:
        try:
            self.db.add(space_work)
            self.db.flush()
            self.db.add(SpaceWorkUser(
                space_work_id=space_work.id,
                user_id=space_work.owner_user_id,
                joined_at=datetime.now(timezone.utc).replace(tzinfo=None),
                is_active=True,
            ))
            self.db.add(AuditLog(
                user_id=space_work.owner_user_id,
                space_work_id=space_work.id,
                action="space_work.created",
                entity_type="space_work",
                entity_id=space_work.id,
                description="Espacio de trabajo creado",
                new_values=space_work.name,
            ))
            self.db.commit()
            self.db.refresh(space_work)

            return space_work

        except Exception:
            self.db.rollback()
            raise
