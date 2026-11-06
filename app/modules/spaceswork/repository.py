from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.modules.spaceswork.models import SpaceWork, SpaceWorkUser
from app.modules.users.models import User, Role
from sqlalchemy import select, true

from app.modules.audit.models import AuditLog

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
