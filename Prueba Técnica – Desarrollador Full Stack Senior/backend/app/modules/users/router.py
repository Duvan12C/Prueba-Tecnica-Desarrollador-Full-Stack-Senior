from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.users.schemas import UserCreateRequest, UserCreateResponse, UserProfileResponse
from app.modules.users.service import UserService
from app.modules.users.repository import UserRepository
from app.shared.api_response import ApiResponse
from app.shared.exceptions import ERROR_RESPONSES


router = APIRouter(
    prefix="/users",
    tags=["Users"],
    responses=ERROR_RESPONSES,
)


@router.get(
    "/me",
    response_model=ApiResponse[UserProfileResponse],
    summary="Consultar mi perfil",
    description="Devuelve el nombre y el rol de la cuenta autenticada.",
)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = UserService(UserRepository(db)).get_profile(current_user)
    return ApiResponse[UserProfileResponse](success=True, message="Perfil de la cuenta", data=profile)


@router.post(
    "/create",
    response_model=ApiResponse[UserCreateResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Registrar cuenta",
    description="Crea una cuenta propia eligiendo el rol Gestor o Colaborador.",
)
def create(data: UserCreateRequest, db: Session = Depends(get_db)):
    repository = UserRepository(db)
    service = UserService(repository)

    try:
        new_user = service.create_user(data)

        return ApiResponse[UserCreateResponse](
            success=True,
            message="Usuario creado con éxito",
            data=new_user
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )
