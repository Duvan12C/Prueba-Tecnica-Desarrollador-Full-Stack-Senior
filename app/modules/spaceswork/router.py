from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.spaceswork.service import SpaceWorkService
from app.modules.spaceswork.repository import SpaceWorkRepository
from app.shared.api_response import ApiResponse
from app.modules.spaceswork.schemas import (
    SpaceWorkCreateRequest,
    SpaceWorkResponse
)
from app.shared.exceptions import ERROR_RESPONSES


router = APIRouter(
    prefix="/space_work",
    tags=["SpaceWork"],
    responses=ERROR_RESPONSES,
)

@router.post(
    "/create",
    response_model=ApiResponse[SpaceWorkResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Crear espacio de trabajo",
    description="Crea un espacio para el Gestor autenticado y lo registra como miembro activo.",
)
def create(
    data: SpaceWorkCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repository = SpaceWorkRepository(db)
    service = SpaceWorkService(repository)

    try:
        new_space_work = service.create_space_work(data, owner_user_id=current_user.id)

        return ApiResponse[SpaceWorkResponse](
            success=True,
            message="Espacio de trabajo creado con éxito",
            data=new_space_work
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
