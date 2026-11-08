from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    space_work_id: int | None
    action: str
    entity_type: str
    entity_id: int
    description: str | None
    old_values: str | None
    new_values: str | None
    created_at: datetime
    actor_name: str | None = None
    resource_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
