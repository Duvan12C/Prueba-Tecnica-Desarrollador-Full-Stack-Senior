import pytest
from sqlalchemy import select
from starlette.websockets import WebSocketDisconnect

from app.modules.collaboration.models import DocumentDraft


def create_document(client, headers, name="Equipo"):
    workspace = client.post("/space_work/create", json={"name": name}, headers=headers).json()["data"]
    document = client.post(
        "/documents",
        json={"space_work_id": workspace["id"], "title": "Plan", "content": "Original"},
        headers=headers,
    ).json()["data"]
    return workspace["id"], document["id"]


def authenticate(socket, headers):
    socket.send_json({"type": "authenticate", "token": headers["Authorization"].removeprefix("Bearer ")})


def receive_event(socket, event_type):
    for _ in range(12):
        message = socket.receive_json()
        if message["type"] == event_type:
            return message
    pytest.fail(f"No llegó el evento {event_type}")


def edit(socket, request_id, base_revision, content):
    socket.send_json({
        "type": "edit",
        "request_id": request_id,
        "base_revision": base_revision,
        "content": content,
    })


def publish(socket, request_id, base_revision):
    socket.send_json({"type": "save_version", "request_id": request_id, "base_revision": base_revision})


def test_collaboration_checks_access_before_sending_document(api, user_factory, auth_headers):
    client, _ = api
    owner = auth_headers(user_factory("owner@example.com", "Gestor"))
    outsider = auth_headers(user_factory("outsider@example.com", "Gestor"))
    _, document_id = create_document(client, owner)
    create_document(client, outsider, "Otro espacio")
    path = f"/documents/{document_id}/collaboration"

    with client.websocket_connect(path) as socket:
        socket.send_json({"type": "authenticate", "token": "invalid"})
        with pytest.raises(WebSocketDisconnect) as denied:
            socket.receive_json()
        assert denied.value.code == 4401

    with client.websocket_connect(path) as socket:
        authenticate(socket, outsider)
        with pytest.raises(WebSocketDisconnect) as denied:
            socket.receive_json()
        assert denied.value.code == 4404


def test_shared_draft_preserves_conflicts_and_creates_versions_only_on_save(api, user_factory, auth_headers, add_member):
    client, sessions = api
    owner_user = user_factory("owner@example.com", "Gestor")
    editor_user = user_factory("editor@example.com")
    reader_user = user_factory("reader@example.com")
    owner = auth_headers(owner_user)
    editor = auth_headers(editor_user)
    reader = auth_headers(reader_user)
    workspace_id, document_id = create_document(client, owner)
    document_path = f"/documents/{document_id}"
    socket_path = f"{document_path}/collaboration"
    for user, permission in ((editor_user, "edit"), (reader_user, "read")):
        add_member(workspace_id, user.id)
        response = client.put(f"{document_path}/permissions/{user.id}", headers=owner, json={"permission": permission})
        assert response.status_code == 200

    with client.websocket_connect(socket_path) as owner_socket, client.websocket_connect(socket_path) as editor_socket:
        authenticate(owner_socket, owner)
        assert receive_event(owner_socket, "document")["version"] == 1
        authenticate(editor_socket, editor)
        assert receive_event(editor_socket, "document")["permission"] == "edit"
        with client.websocket_connect(socket_path) as reader_socket:
            authenticate(reader_socket, reader)
            assert receive_event(reader_socket, "document")["permission"] == "read"
            people = receive_event(reader_socket, "presence")["participants"]
            assert {person["user_id"] for person in people} == {owner_user.id, editor_user.id, reader_user.id}

            edit(reader_socket, "reader", 1, "Prohibido")
            assert receive_event(reader_socket, "error")["request_id"] == "reader"
            publish(reader_socket, "publish-reader", 1)
            assert receive_event(reader_socket, "error")["request_id"] == "publish-reader"
            edit(editor_socket, "first", 1, "P")
            assert receive_event(editor_socket, "draft_synced") == {
                "type": "draft_synced", "request_id": "first", "revision": 2, "has_unpublished_changes": True,
            }
            received = receive_event(reader_socket, "document")
            assert (received["content"], received["version"], received["revision"]) == ("P", 1, 2)
            edit(owner_socket, "stale", 1, "Mi borrador")
            conflict = receive_event(owner_socket, "conflict")
            assert (conflict["request_id"], conflict["revision"], conflict["content"]) == ("stale", 2, "P")

            edit(editor_socket, "second", 2, "Primera edición")
            assert receive_event(editor_socket, "draft_synced")["revision"] == 3
            assert receive_event(reader_socket, "document")["content"] == "Primera edición"
            history = client.get(f"{document_path}/versions", headers=owner).json()["data"]
            assert [version["content"] for version in history] == ["Original"]
            pending_restore = client.post(f"{document_path}/versions/1/restore", headers=owner)
            assert pending_restore.status_code == 409
            with sessions() as db:
                drafts = db.scalars(select(DocumentDraft)).all()
                assert [(draft.document_id, draft.revision, draft.content) for draft in drafts] == [
                    (document_id, 3, "Primera edición"),
                ]

            with client.websocket_connect(socket_path) as reopened:
                authenticate(reopened, editor)
                snapshot = receive_event(reopened, "document")
                assert snapshot["content"] == "Primera edición" and snapshot["has_unpublished_changes"]

            publish(editor_socket, "save", 3)
            confirmation = receive_event(editor_socket, "version_published")
            assert (confirmation["version"], confirmation["created"]) == (2, True)
            saving = receive_event(reader_socket, "version_activity")
            saved = receive_event(reader_socket, "version_activity")
            assert saving["status"] == "saving" and saving["name"] == editor_user.name
            assert saved["status"] == "saved" and saved["version"] == 2
            publish(editor_socket, "duplicate", 3)
            assert receive_event(editor_socket, "version_published")["created"] is False
            stale_rest = client.put(document_path, headers=owner, json={"base_version": 1, "content": "Obsoleto"})
            assert stale_rest.status_code == 409
            restore = client.post(f"{document_path}/versions/1/restore", headers=owner)
            assert restore.status_code == 200
            restored = receive_event(reader_socket, "document")
            assert (restored["version"], restored["revision"], restored["content"]) == (3, 4, "Original")

            assert client.delete(f"{document_path}/permissions/{reader_user.id}", headers=owner).status_code == 200
            edit(editor_socket, "after-revocation", 4, "Segunda edición sin publicar")
            assert receive_event(editor_socket, "draft_synced")["revision"] == 5
            with pytest.raises(WebSocketDisconnect) as denied:
                reader_socket.receive_json()
            assert denied.value.code == 4404

    history = client.get(f"{document_path}/versions", headers=owner).json()["data"]
    assert [version["content"] for version in history] == ["Original", "Primera edición", "Original"]
    assert history[1]["change_summary"] == "Versión del borrador compartido"
    audit = client.get("/audit", headers=owner, params={"space_work_id": workspace_id, "action": "document.updated"}).json()["data"]
    assert len(audit) == 1 and audit[0]["user_id"] == editor_user.id
