from datetime import date

from app.modules.audit.repository import AuditRepository
from app.modules.audit.schemas import AuditLogResponse
from app.shared.exceptions import BadRequestError, ResourceNotFoundError


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
        start_date: date | None,
        end_date: date | None,
        limit: int,
        offset: int,
    ) -> tuple[list[AuditLogResponse], int]:
        if not self.repository.can_view_space(space_work_id, user_id):
            raise ResourceNotFoundError("Espacio de trabajo no encontrado")
        if start_date is not None and end_date is not None and start_date > end_date:
            raise BadRequestError("La fecha de inicio debe ser anterior o igual a la fecha de fin")

        rows, total = self.repository.list_for_space(
            space_work_id,
            action=action,
            entity_type=entity_type,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset,
        )
        records = [
            AuditLogResponse.model_validate(event).model_copy(update={
                "actor_name": actor_name,
                "resource_name": resource_name,
            })
            for event, actor_name, resource_name in rows
        ]
        return records, total
