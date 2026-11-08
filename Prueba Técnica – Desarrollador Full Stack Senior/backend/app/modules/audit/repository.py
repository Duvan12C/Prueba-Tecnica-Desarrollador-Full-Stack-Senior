from datetime import date, datetime, time, timedelta

from sqlalchemy import and_, func, select, true
from sqlalchemy.orm import Session

from app.modules.audit.models import AuditLog
from app.modules.documents.model import Document
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
        start_date: date | None,
        end_date: date | None,
        limit: int,
        offset: int,
    ) -> tuple[list[tuple[AuditLog, str | None, str | None]], int]:
        filters = [AuditLog.space_work_id == space_work_id]
        if action:
            filters.append(AuditLog.action == action)
        if entity_type:
            filters.append(AuditLog.entity_type == entity_type)
        if start_date is not None:
            filters.append(AuditLog.created_at >= datetime.combine(start_date, time.min))
        if end_date is not None and end_date < date.max:
            day_after_end = end_date + timedelta(days=1)
            filters.append(AuditLog.created_at < datetime.combine(day_after_end, time.min))

        statement = (
            select(AuditLog, User.name, func.coalesce(Document.title, SpaceWork.name))
            .select_from(AuditLog)
            .outerjoin(User, User.id == AuditLog.user_id)
            .outerjoin(
                Document,
                and_(
                    AuditLog.entity_type == "document",
                    Document.id == AuditLog.entity_id,
                    Document.space_work_id == AuditLog.space_work_id,
                ),
            )
            .outerjoin(
                SpaceWork,
                and_(
                    AuditLog.entity_type == "space_work",
                    SpaceWork.id == AuditLog.entity_id,
                    SpaceWork.id == AuditLog.space_work_id,
                ),
            )
            .where(*filters)
            .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
            .offset(offset)
            .limit(limit)
        )
        total = self.db.scalar(select(func.count()).select_from(AuditLog).where(*filters)) or 0
        rows = self.db.execute(statement)
        return [(event, actor_name, resource_name) for event, actor_name, resource_name in rows], total
