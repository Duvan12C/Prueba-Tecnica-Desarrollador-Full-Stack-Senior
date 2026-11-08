from datetime import datetime, timezone
from hashlib import sha256
from secrets import token_urlsafe
from time import time
from uuid import uuid4

from app.core.config import settings
from app.modules.auth.models import AuthSession
from app.modules.auth.schemas import LoginRequest, RefreshRequest, TokenResponse
from app.modules.auth.repository import AuthRepository
from app.core.security import verify_password, create_access_token
from app.shared.exceptions import UnauthorizedError


class AuthService:

    def __init__(self, repository: AuthRepository):
        self.repository = repository

    def login_user(self, data: LoginRequest) -> tuple[TokenResponse, str]:

        user = self.repository.get_by_email(data.email)

        if not user:
            raise UnauthorizedError("Credenciales incorrectas")

        if not verify_password(data.password, user.password_hash):
            raise UnauthorizedError("Credenciales incorrectas")

        if not user.is_active:
            raise UnauthorizedError("Credenciales incorrectas")

        return self.start_session(user.id)

    def start_session(self, user_id: int) -> tuple[TokenResponse, str]:
        now = int(time())
        secret = token_urlsafe(32)
        expires_at = now + settings.SESSION_MAX_HOURS * 3600
        session = AuthSession(
            id=uuid4().hex,
            user_id=user_id,
            refresh_digest=_digest(secret),
            idle_expires_at=min(expires_at, now + settings.SESSION_IDLE_MINUTES * 60),
            expires_at=expires_at,
        )
        token = _issue_token(session, now, session.idle_expires_at)
        self.repository.create_session(session, now)
        return token, secret

    def refresh(self, data: RefreshRequest, secret: str | None) -> TokenResponse:
        now = int(time())
        session = self.repository.get_refresh_session(data.session_id, _digest(secret), now) if secret else None
        if session is None:
            raise UnauthorizedError("La sesión no es válida o expiró")

        deadline = session.idle_expires_at
        if data.active:
            deadline = max(deadline, min(session.expires_at, now + settings.SESSION_IDLE_MINUTES * 60))
        token = _issue_token(session, now, deadline)

        if data.active and not self.repository.extend_session(data.session_id, now, deadline):
            raise UnauthorizedError("La sesión no es válida o expiró")
        return token

    def logout(self, session_id: str, secret: str | None) -> bool:
        return bool(secret and self.repository.revoke_session(session_id, _digest(secret)))


def _issue_token(session: AuthSession, now: int, idle_expires_at: int) -> TokenResponse:
    access_expires_at = min(session.expires_at, now + settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    expires_at = datetime.fromtimestamp(access_expires_at, tz=timezone.utc)
    return TokenResponse(
        access_token=create_access_token(session.user_id, session.id, expires_at),
        session_id=session.id,
        access_expires_at=access_expires_at,
        idle_expires_at=idle_expires_at,
    )


def _digest(secret: str) -> str:
    return sha256(secret.encode()).hexdigest()
