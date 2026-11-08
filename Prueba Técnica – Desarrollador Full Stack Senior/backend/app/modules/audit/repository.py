from sqlalchemy import select, true
from sqlalchemy.orm import Session

from app.modules.audit.models import AuditLog
from app.modules.spaceswork.models import SpaceWork
from app.modules.users.models import Role, User


class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def can_view_space(self, space_work_id: int, user_id: int) -> bool:
        statement = (
            select(SpaceWork.id)
            .join(User, User.id == SpaceWork.owner_user_id)
            .join(Role, Role.id == User.rol_id)
            .where(
                SpaceWork.id == space_work_id,
                SpaceWork.owner_user_id == user_id,
                User.is_active == true(),
                Role.name == "Gestor",
            )
        )
        return self.db.scalar(statement) is not None

    def list_for_space(
        self,
        space_work_id: int,
        *,
        action: str | None,
        entity_type: str | None,
        limit: int,
        offset: int,
    ) -> list[AuditLog]:
        statement = select(AuditLog).where(AuditLog.space_work_id == space_work_id)
        if action:
            statement = statement.where(AuditLog.action == action)
        if entity_type:
            statement = statement.where(AuditLog.entity_type == entity_type)
        statement = statement.order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        statement = statement.offset(offset).limit(limit)
        return list(self.db.scalars(statement).all())
