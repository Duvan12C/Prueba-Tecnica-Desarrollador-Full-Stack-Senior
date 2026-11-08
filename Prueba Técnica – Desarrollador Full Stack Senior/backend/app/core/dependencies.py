from dataclasses import dataclass
from time import time

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.modules.auth.repository import AuthRepository
from app.modules.users.models import User


bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthenticatedSession:
    user: User
    session_id: str


def authenticate_access_token(token: str, db: Session) -> AuthenticatedSession | None:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"require": ["sub", "sid", "exp"]},
        )
        user_id = int(payload["sub"])
        session_id = payload["sid"]
        if not isinstance(session_id, str):
            return None
    except (jwt.InvalidTokenError, ValueError, TypeError):
        return None

    user = AuthRepository(db).get_session_user(session_id, user_id, int(time()))
    return AuthenticatedSession(user, session_id) if user is not None else None


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise credentials_exception

    session = authenticate_access_token(credentials.credentials, db)
    if session is None:
        raise credentials_exception
    return session.user
