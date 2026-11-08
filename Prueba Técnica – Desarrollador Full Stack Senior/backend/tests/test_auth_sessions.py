from datetime import datetime, timedelta, timezone
from time import time

import pytest

from app.core import dependencies
from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.modules.auth import service
from app.modules.users.models import User


@pytest.fixture
def logged_in(api, user_factory, monkeypatch):
    client, sessions = api
    now = int(time())
    clock = [now]
    monkeypatch.setattr(service, "time", lambda: clock[0])
    monkeypatch.setattr(dependencies, "time", lambda: clock[0])
    user = user_factory("session@example.com")
    password = "Example-Test@123"
    with sessions() as db:
        db.get(User, user.id).password_hash = hash_password(password)
        db.commit()
    response = client.post("/auth/login", json={"email": user.email, "password": password})
    assert response.status_code == 200
    assert "HttpOnly" in response.headers["set-cookie"]
    return client, response.json()["data"], clock, user.id


def authorization(session):
    return {"Authorization": f"Bearer {session['access_token']}"}


def test_profile_returns_only_the_authenticated_account(api, user_factory, auth_headers):
    client, _ = api
    manager = user_factory("duvan@example.com", "Gestor")
    collaborator = user_factory("ana@example.com", "Colaborador")

    assert client.get("/users/me").status_code == 401
    for user, role in ((manager, "Gestor"), (collaborator, "Colaborador")):
        response = client.get("/users/me", headers=auth_headers(user))
        assert response.status_code == 200
        assert response.json()["data"] == {"name": user.name, "role_name": role}


def test_activity_renews_session_and_idle_expires_it(logged_in):
    client, session, clock, _ = logged_in
    session_id = session["session_id"]
    idle_deadline = session["idle_expires_at"]
    clock[0] = idle_deadline - 60

    passive = client.post("/auth/refresh", json={"session_id": session_id})
    assert passive.json()["data"]["idle_expires_at"] == idle_deadline

    active = client.post("/auth/refresh", json={"session_id": session_id, "active": True})
    assert active.status_code == 200
    renewed = active.json()["data"]
    assert renewed["idle_expires_at"] > idle_deadline

    clock[0] = idle_deadline
    assert client.get("/space_work", headers=authorization(renewed)).status_code == 200

    clock[0] = renewed["idle_expires_at"]
    assert client.get("/space_work", headers=authorization(renewed)).status_code == 401
    assert client.post("/auth/refresh", json={"session_id": session_id, "active": True}).status_code == 401


def test_refresh_after_access_token_expires_and_logout_revokes_access(logged_in):
    client, session, _, user_id = logged_in
    session_id = session["session_id"]
    expired_at = datetime.now(timezone.utc) - timedelta(seconds=5)
    expired = {"access_token": create_access_token(user_id, session_id, expired_at)}
    assert client.get("/space_work", headers=authorization(expired)).status_code == 401

    refresh = client.post("/auth/refresh", json={"session_id": session_id})
    assert refresh.status_code == 200
    renewed = refresh.json()["data"]
    assert client.get("/space_work", headers=authorization(renewed)).status_code == 200

    assert client.post("/auth/logout", json={"session_id": session_id}).status_code == 204
    assert client.get("/space_work", headers=authorization(renewed)).status_code == 401
    assert client.post("/auth/refresh", json={"session_id": session_id}).status_code == 401


def test_activity_cannot_extend_session_past_absolute_limit(logged_in):
    client, session, clock, _ = logged_in
    session_id = session["session_id"]
    max_deadline = clock[0] + settings.SESSION_MAX_HOURS * 3600
    step = settings.SESSION_IDLE_MINUTES * 30
    for now in range(clock[0] + step, max_deadline, step):
        clock[0] = now
        refresh = client.post("/auth/refresh", json={"session_id": session_id, "active": True})
        assert refresh.status_code == 200
        assert refresh.json()["data"]["idle_expires_at"] <= max_deadline

    clock[0] = max_deadline
    assert client.post("/auth/refresh", json={"session_id": session_id, "active": True}).status_code == 401
