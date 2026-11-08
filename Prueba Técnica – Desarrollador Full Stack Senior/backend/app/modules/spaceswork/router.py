from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.spaceswork.service import SpaceWorkService
from app.modules.spaceswork.repository import SpaceWorkRepository
from app.shared.api_response import ApiResponse
from app.modules.spaceswork.schemas import (
    SpaceWorkCapabilities,
    SpaceWorkCreateRequest,
    SpaceWorkMemberResponse,
    SpaceWorkResponse
)
from app.shared.exceptions import ERROR_RESPONSES


router = APIRouter(
    prefix="/space_work",
    tags=["SpaceWork"],
    responses=ERROR_RESPONSES,
)


@router.get(
    "/capabilities",
    response_model=ApiResponse[SpaceWorkCapabilities],
    summary="Consultar permisos sobre espacios de trabajo",
)
def get_capabilities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = SpaceWorkService(SpaceWorkRepository(db))
    return ApiResponse[SpaceWorkCapabilities](
        success=True,
        message="Permisos sobre espacios de trabajo",
        data=SpaceWorkCapabilities(can_create=service.can_create(current_user.id)),
    )


@router.get(
    "",
    response_model=ApiResponse[list[SpaceWorkResponse]],
    summary="Listar mis espacios",
    description="Devuelve los espacios activos donde el usuario autenticado es propietario o miembro activo.",
)
def list_spaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    spaces = SpaceWorkService(SpaceWorkRepository(db)).list_for_user(current_user.id)
    return ApiResponse[list[SpaceWorkResponse]](
        success=True,
        message="Espacios de trabajo del usuario",
        data=spaces,
    )


@router.get(
    "/{space_work_id}/members",
    response_model=ApiResponse[list[SpaceWorkMemberResponse]],
    summary="Listar miembros activos",
    description=(
        "Devuelve los miembros activos del espacio. Requiere ser su Gestor propietario "
        "o tener permiso admin en un documento activo del espacio."
    ),
)
def list_members(
    space_work_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    members = SpaceWorkService(SpaceWorkRepository(db)).list_members(space_work_id, current_user.id)
    return ApiResponse[list[SpaceWorkMemberResponse]](
        success=True,
        message="Miembros activos del espacio",
        data=members,
    )


@router.delete(
    "/{space_work_id}/members/{member_user_id}",
    response_model=ApiResponse[None],
    summary="Retirar miembro del espacio",
    description="Desactiva su membresía, revoca sus permisos documentales y registra la acción en la bitácora.",
)
def remove_member(
    space_work_id: int,
    member_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    SpaceWorkService(SpaceWorkRepository(db)).remove_member(
        space_work_id,
        member_user_id,
        current_user.id,
    )
    return ApiResponse[None](success=True, message="Miembro retirado del espacio y accesos revocados")


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
