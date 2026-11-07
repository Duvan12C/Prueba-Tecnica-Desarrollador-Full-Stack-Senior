from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.shared.api_response import ApiResponse
from app.modules.auth.schemas import LoginRequest, TokenResponse
from app.modules.auth.service import AuthService
from app.modules.auth.repository import AuthRepository
from app.shared.exceptions import ERROR_RESPONSES

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
    responses=ERROR_RESPONSES,
)


@router.post(
    "/login",
    response_model=ApiResponse[TokenResponse],
    summary="Iniciar sesión",
    description="Valida el correo y la contraseña y devuelve un token Bearer de acceso.",
)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    repository = AuthRepository(db)
    service = AuthService(repository)

    try:
        token = service.login_user(data)

        return ApiResponse[TokenResponse](
            success=True,
            message="Inicio de sesión exitoso",
            data=token
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error)
        )
