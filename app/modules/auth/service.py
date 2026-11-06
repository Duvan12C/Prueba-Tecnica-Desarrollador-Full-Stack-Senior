from app.modules.auth.schemas import LoginRequest, TokenResponse
from app.modules.auth.repository import AuthRepository
from app.core.security import verify_password, create_access_token
from app.shared.exceptions import UnauthorizedError


class AuthService:

    def __init__(self, repository: AuthRepository):
        self.repository = repository

    def login_user(self, data: LoginRequest) -> TokenResponse:

        user = self.repository.get_by_email(data.email)

        if not user:
            raise UnauthorizedError("Credenciales incorrectas")

        if not verify_password(data.password, user.password_hash):
            raise UnauthorizedError("Credenciales incorrectas")

        if not user.is_active:
            raise UnauthorizedError("Credenciales incorrectas")

        token = create_access_token(user.id)

        return TokenResponse(
            access_token=token
        )
