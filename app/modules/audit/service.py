from app.modules.audit.repository import AuditRepository


class AuditService:
    def __init__(self, repository: AuditRepository):
        self.repository = repository

    def list_for_space(
        self,
        space_work_id: int,
        user_id: int,
        *,
        action: str | None,
        entity_type: str | None,
        limit: int,
        offset: int,
    ):
        if not self.repository.can_view_space(space_work_id, user_id):
            raise LookupError("Espacio de trabajo no encontrado")
        return self.repository.list_for_space(
            space_work_id,
            action=action,
            entity_type=entity_type,
            limit=limit,
            offset=offset,
        )
