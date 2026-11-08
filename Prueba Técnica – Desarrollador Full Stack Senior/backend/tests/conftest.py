from collections.abc import Iterator
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, select
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db, get_session_factory
from app.main import app
from app.modules.permissions.models import Permission
from app.modules.users.models import Role, User


@pytest.fixture
def api() -> Iterator[tuple[TestClient, sessionmaker]]:
    database_path = Path(__file__).parent / f".test-{uuid4().hex}.sqlite"
    engine = create_engine(
        f"sqlite+pysqlite:///{database_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _record):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    test_sessions = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    Base.metadata.create_all(engine)

    with test_sessions() as db:
        db.add_all([
            Role(name="Gestor", description="Dueño del espacio"),
            Role(name="Colaborador", description="Miembro del espacio"),
            Permission(name="read", description="Lectura"),
            Permission(name="edit", description="Edición"),
            Permission(name="admin", description="Administración del documento"),
        ])
        db.commit()

    def override_get_db():
        with test_sessions() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_session_factory] = lambda: test_sessions
    try:
        with TestClient(app) as client:
            yield client, test_sessions
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(engine)
        engine.dispose()
        database_path.unlink(missing_ok=True)


@pytest.fixture
def user_factory(api):
    _, test_sessions = api

    def create_user(email: str, role_name: str = "Colaborador") -> User:
        with test_sessions() as db:
            role = db.scalar(select(Role).where(Role.name == role_name))
            user = User(
                name=email.split("@")[0],
                email=email,
                password_hash="not-used-by-these-tests",
                rol_id=role.id,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return user

    return create_user


@pytest.fixture
def auth_headers(api):
    from app.modules.auth.repository import AuthRepository
    from app.modules.auth.service import AuthService

    _, test_sessions = api

    def make(user: User) -> dict[str, str]:
        with test_sessions() as db:
            token, _ = AuthService(AuthRepository(db)).start_session(user.id)
        return {"Authorization": f"Bearer {token.access_token}"}

    return make


@pytest.fixture
def add_member(api):
    _, test_sessions = api

    def add(space_work_id: int, user_id: int) -> None:
        from app.modules.spaceswork.models import SpaceWorkUser

        with test_sessions() as db:
            db.add(SpaceWorkUser(
                space_work_id=space_work_id,
                user_id=user_id,
                joined_at=datetime.now(timezone.utc).replace(tzinfo=None),
                is_active=True,
            ))
            db.commit()

    return add
