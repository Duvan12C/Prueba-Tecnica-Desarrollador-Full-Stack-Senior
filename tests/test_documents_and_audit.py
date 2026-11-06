from datetime import datetime, timezone

from sqlalchemy import select

from app.modules.audit.models import AuditLog
from app.modules.documents.model import Document
from app.modules.spaceswork.models import SpaceWork, SpaceWorkUser
from app.modules.users.models import User
from app.modules.versions.models import DocumentVersion


def create_space(test_sessions, owner: User, name: str) -> SpaceWork:
    with test_sessions() as db:
        space = SpaceWork(name=name, owner_user_id=owner.id, is_active=True)
        db.add(space)
        db.flush()
        db.add(SpaceWorkUser(
            space_work_id=space.id,
            user_id=owner.id,
            joined_at=datetime.now(timezone.utc).replace(tzinfo=None),
            is_active=True,
        ))
        db.commit()
        db.refresh(space)
        return space


def create_document(client, manager: User, headers, space_id: int, content="initial") -> int:
    response = client.post(
        "/documents",
        headers=headers(manager),
        json={"space_work_id": space_id, "title": "Test document", "content": content},
    )
    assert response.status_code == 201, response.text
    return response.json()["data"]["id"]


def test_user_cannot_list_or_read_documents_from_other_space(api, user_factory, auth_headers):
    client, test_sessions = api
    manager_a = user_factory("manager-a@example.com", "Gestor")
    manager_b = user_factory("manager-b@example.com", "Gestor")
    space_a = create_space(test_sessions, manager_a, "Space A")
    space_b = create_space(test_sessions, manager_b, "Space B")
    foreign_document_id = create_document(client, manager_b, auth_headers, space_b.id, "private")

    list_response = client.get(
        f"/documents?space_work_id={space_b.id}",
        headers=auth_headers(manager_a),
    )
    assert list_response.status_code == 200
    assert list_response.json()["data"] == []

    read_response = client.get(
        f"/documents/{foreign_document_id}",
        headers=auth_headers(manager_a),
    )
    assert read_response.status_code == 404


def test_read_permission_cannot_edit_but_edit_creates_new_immutable_version(
    api, user_factory, auth_headers, add_member
):
    client, test_sessions = api
    manager = user_factory("owner@example.com", "Gestor")
    collaborator = user_factory("collaborator@example.com")
    space = create_space(test_sessions, manager, "Shared space")
    add_member(space.id, collaborator.id)
    document_id = create_document(client, manager, auth_headers, space.id, "version one")

    permission_response = client.put(
        f"/documents/{document_id}/permissions/{collaborator.id}",
        headers=auth_headers(manager),
        json={"permission": "read"},
    )
    assert permission_response.status_code == 200, permission_response.text

    read_response = client.get(f"/documents/{document_id}", headers=auth_headers(collaborator))
    assert read_response.status_code == 200
    denied_edit = client.put(
        f"/documents/{document_id}",
        headers=auth_headers(collaborator),
        json={"content": "should not be saved"},
    )
    assert denied_edit.status_code == 403

    permission_response = client.put(
        f"/documents/{document_id}/permissions/{collaborator.id}",
        headers=auth_headers(manager),
        json={"permission": "edit"},
    )
    assert permission_response.status_code == 200
    saved = client.put(
        f"/documents/{document_id}",
        headers=auth_headers(collaborator),
        json={"content": "version two"},
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["data"]["version_number"] == 2

    with test_sessions() as db:
        versions = list(db.scalars(
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.version_number)
        ).all())
    assert [version.content for version in versions] == ["version one", "version two"]
    assert [version.version_number for version in versions] == [1, 2]


def test_invitation_acceptance_adds_member_and_is_audited(api, user_factory, auth_headers):
    client, test_sessions = api
    manager = user_factory("invite-owner@example.com", "Gestor")
    invitee = user_factory("invitee@example.com")
    space_response = client.post(
        "/space_work/create",
        headers=auth_headers(manager),
        json={"name": "Invitation space", "description": "test"},
    )
    assert space_response.status_code == 201, space_response.text
    space_id = space_response.json()["data"]["id"]

    invitation_response = client.post(
        "/invitations/create",
        headers=auth_headers(manager),
        json={"space_work_id": space_id, "email": invitee.email},
    )
    assert invitation_response.status_code == 201, invitation_response.text
    invitation_token = invitation_response.json()["data"]["token"]

    accept_response = client.post(
        "/invitations/accept",
        headers=auth_headers(invitee),
        json={"token": invitation_token},
    )
    assert accept_response.status_code == 200, accept_response.text

    with test_sessions() as db:
        membership = db.scalar(select(SpaceWorkUser).where(
            SpaceWorkUser.space_work_id == space_id,
            SpaceWorkUser.user_id == invitee.id,
        ))
        actions = set(db.scalars(select(AuditLog.action).where(AuditLog.space_work_id == space_id)).all())
    assert membership is not None and membership.is_active
    assert {"space_work.created", "invitation.created", "invitation.accepted"} <= actions

    foreign_audit = client.get(f"/audit?space_work_id={space_id}", headers=auth_headers(invitee))
    assert foreign_audit.status_code == 404


def test_document_delete_is_soft_and_audited(api, user_factory, auth_headers):
    client, test_sessions = api
    manager = user_factory("delete-owner@example.com", "Gestor")
    space = create_space(test_sessions, manager, "Delete space")
    document_id = create_document(client, manager, auth_headers, space.id)

    deleted = client.delete(f"/documents/{document_id}", headers=auth_headers(manager))
    assert deleted.status_code == 200, deleted.text
    assert client.get(f"/documents/{document_id}", headers=auth_headers(manager)).status_code == 404

    with test_sessions() as db:
        document = db.get(Document, document_id)
        version_count = len(db.scalars(select(DocumentVersion).where(
            DocumentVersion.document_id == document_id
        )).all())
        deleted_action = db.scalar(select(AuditLog.id).where(
            AuditLog.space_work_id == space.id,
            AuditLog.action == "document.deleted",
            AuditLog.entity_id == document_id,
        ))
    assert document.is_deleted
    assert version_count == 1
    assert deleted_action is not None
