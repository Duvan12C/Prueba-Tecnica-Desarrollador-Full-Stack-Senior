from fastapi import APIRouter, Cookie, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import LoginRequest, RefreshRequest, SessionRequest, TokenResponse
from app.modules.auth.service import AuthService
from app.shared.api_response import ApiResponse
from app.shared.exceptions import ERROR_RESPONSES

router = APIRouter(prefix="/auth", tags=["Authentication"], responses=ERROR_RESPONSES)
REFRESH_COOKIE = "docspace_refresh"


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(AuthRepository(db))


@router.post("/login", response_model=ApiResponse[TokenResponse], summary="Iniciar sesión")
def login(data: LoginRequest, response: Response, service: AuthService = Depends(get_auth_service)):
    token, secret = service.login_user(data)
    response.headers["Cache-Control"] = "no-store"
    response.set_cookie(
        REFRESH_COOKIE,
        secret,
        max_age=settings.SESSION_MAX_HOURS * 3600,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite="strict",
    )
    return ApiResponse[TokenResponse](success=True, message="Inicio de sesión exitoso", data=token)


@router.post("/refresh", response_model=ApiResponse[TokenResponse], summary="Renovar la sesión")
def refresh(
    data: RefreshRequest,
    response: Response,
    secret: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    service: AuthService = Depends(get_auth_service),
):
    token = service.refresh(data, secret)
    response.headers["Cache-Control"] = "no-store"
    return ApiResponse[TokenResponse](success=True, message="Sesión renovada", data=token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Cerrar la sesión")
def logout(
    data: SessionRequest,
    secret: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    service: AuthService = Depends(get_auth_service),
):
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    if service.logout(data.session_id, secret):
        response.delete_cookie(REFRESH_COOKIE, secure=settings.SESSION_COOKIE_SECURE, httponly=True, samesite="strict")
    return response
