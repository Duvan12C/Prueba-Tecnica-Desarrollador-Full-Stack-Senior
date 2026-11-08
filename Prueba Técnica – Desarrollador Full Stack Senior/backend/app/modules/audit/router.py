from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.audit.repository import AuditRepository
from app.modules.audit.schemas import AuditLogResponse
from app.modules.audit.service import AuditService
from app.modules.users.models import User
from app.shared.api_response import ApiResponse
from app.shared.exceptions import ERROR_RESPONSES


router = APIRouter(prefix="/audit", tags=["Audit"], responses=ERROR_RESPONSES)


@router.get(
    "",
    response_model=ApiResponse[list[AuditLogResponse]],
    summary="Consultar bitácora",
    description="Devuelve eventos del espacio del Gestor propietario, incluso si se archivó. Permite filtrar y paginar resultados.",
)
def list_audit_logs(
    space_work_id: int = Query(gt=0, description="Identificador del espacio del Gestor autenticado"),
    action: str | None = Query(default=None, max_length=100, description="Filtra por acción, por ejemplo document.updated"),
    entity_type: str | None = Query(default=None, max_length=100, description="Filtra por tipo de recurso, por ejemplo document"),
    limit: int = Query(default=50, ge=1, le=100, description="Cantidad máxima de eventos por página"),
    offset: int = Query(default=0, ge=0, description="Cantidad de eventos que se omiten"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = AuditService(AuditRepository(db))
    try:
        records = service.list_for_space(
            space_work_id,
            current_user.id,
            action=action,
            entity_type=entity_type,
            limit=limit,
            offset=offset,
        )
        return ApiResponse[list[AuditLogResponse]](
            success=True,
            message="Bitácora del espacio de trabajo",
            data=records,
        )
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
