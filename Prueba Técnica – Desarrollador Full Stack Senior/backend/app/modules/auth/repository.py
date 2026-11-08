from sqlalchemy import case, delete, select, true, update
from sqlalchemy.orm import Session

from app.modules.users.models import User
from app.modules.auth.models import AuthSession


class AuthRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)

        return self.db.scalar(statement)

    def create_session(self, session: AuthSession, now: int) -> None:
        self.db.execute(delete(AuthSession).where(
            AuthSession.user_id == session.user_id,
            AuthSession.idle_expires_at <= now,
        ))
        self.db.add(session)
        self.db.commit()

    def get_session_user(self, session_id: str, user_id: int, now: int) -> User | None:
        return self.db.scalar(
            select(User).join(AuthSession, AuthSession.user_id == User.id).where(
                User.id == user_id,
                User.is_active == true(),
                *_active_session(session_id, now),
            )
        )

    def get_refresh_session(self, session_id: str, digest: str, now: int) -> AuthSession | None:
        return self.db.scalar(
            select(AuthSession).join(User, User.id == AuthSession.user_id).where(
                User.is_active == true(),
                AuthSession.refresh_digest == digest,
                *_active_session(session_id, now),
            )
        )

    def extend_session(self, session_id: str, now: int, deadline: int) -> bool:
        result = self.db.execute(
            update(AuthSession).where(*_active_session(session_id, now)).values(
                idle_expires_at=case(
                    (AuthSession.idle_expires_at < deadline, deadline),
                    else_=AuthSession.idle_expires_at,
                )
            )
        )
        self.db.commit()
        return result.rowcount == 1

    def revoke_session(self, session_id: str, digest: str) -> bool:
        result = self.db.execute(
            delete(AuthSession).where(AuthSession.id == session_id, AuthSession.refresh_digest == digest)
        )
        self.db.commit()
        return result.rowcount == 1


def _active_session(session_id: str, now: int):
    return (
        AuthSession.id == session_id,
        AuthSession.idle_expires_at > now,
        AuthSession.expires_at > now,
    )
