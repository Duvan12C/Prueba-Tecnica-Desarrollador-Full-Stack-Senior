from datetime import datetime, timezone

from sqlalchemy import select

from app.modules.audit.models import AuditLog
from app.modules.documents.model import Document
from app.modules.permissions.models import PermissionDocumentUser
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
    assert read_response.json()["data"]["permission"] == "read"
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
    assert client.get(f"/documents/{document_id}", headers=auth_headers(collaborator)).json()["data"]["permission"] == "edit"
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


def test_document_permissions_and_member_previews_respect_workspace_access(api, user_factory, auth_headers, add_member):
    client, test_sessions = api
    owner = user_factory("owner@example.com", "Gestor")
    admin = user_factory("admin@example.com")
    reader = user_factory("reader@example.com")
    member = user_factory("member@example.com")
    outsider = user_factory("outsider@example.com")
    space = create_space(test_sessions, owner, "Team")
    for user in (admin, reader, member):
        add_member(space.id, user.id)
    doc_id = create_document(client, owner, auth_headers, space.id)
    path = f"/documents/{doc_id}/permissions"
    owner_headers = auth_headers(owner)
    for user, permission in ((admin, "admin"), (reader, "read")):
        assert client.put(f"{path}/{user.id}", headers=owner_headers, json={"permission": permission}).status_code == 200

    for actor in (owner, admin):
        response = client.get(path, headers=auth_headers(actor))
        assert response.status_code == 200, response.text
        permissions = {row["user_id"]: row["permission"] for row in response.json()["data"]}
        assert permissions == {owner.id: "admin", admin.id: "admin", reader.id: "read", member.id: None}
        summary = client.get("/space_work", headers=auth_headers(actor)).json()["data"][0]["member_summary"]
        assert summary["count"] == 4
        assert len(summary["names"]) == 3
        assert summary["names"][0] == owner.name
    for actor, expected_status in ((reader, 403), (member, 404), (outsider, 404)):
        assert client.get(path, headers=auth_headers(actor)).status_code == expected_status
        assert client.get(f"/space_work/{space.id}/members", headers=auth_headers(actor)).status_code == 404
    assert client.get("/space_work", headers=auth_headers(reader)).json()["data"][0]["member_summary"] is None

    admin_headers = auth_headers(admin)
    assert client.put(f"{path}/{member.id}", headers=admin_headers, json={"permission": "edit"}).status_code == 200
    assert client.delete(f"{path}/{member.id}", headers=admin_headers).status_code == 200
    assert client.get(f"/documents/{doc_id}", headers=auth_headers(member)).status_code == 404


def test_archive_workspace_blocks_access_and_preserves_history(api, user_factory, auth_headers, add_member):
    client, test_sessions = api
    owner = user_factory("owner@example.com", "Gestor")
    member = user_factory("member@example.com")
    owner_headers = auth_headers(owner)
    member_headers = auth_headers(member)
    space = create_space(test_sessions, owner, "Team")
    add_member(space.id, member.id)
    doc_id = create_document(client, owner, auth_headers, space.id)
    doc_path = f"/documents/{doc_id}"
    space_path = f"/space_work/{space.id}"
    assert client.put(f"{doc_path}/permissions/{member.id}", headers=owner_headers, json={"permission": "admin"}).status_code == 200
    assert client.delete(space_path, headers=member_headers).status_code == 403
    for _ in range(2):
        assert client.delete(space_path, headers=owner_headers).status_code == 200

    for headers in (owner_headers, member_headers):
        assert client.get("/space_work", headers=headers).json()["data"] == []
        assert client.get(f"/documents?space_work_id={space.id}", headers=headers).json()["data"] == []
        for path in (doc_path, f"{doc_path}/versions", f"{doc_path}/versions/compare?from_version=1&to_version=1", f"{doc_path}/permissions"):
            assert client.get(path, headers=headers).status_code == 404
        assert client.put(doc_path, headers=headers, json={"content": "changed"}).status_code == 404
        assert client.post(f"{doc_path}/versions/1/restore", headers=headers).status_code == 404

    audit_path = f"/audit?space_work_id={space.id}&action=space_work.archived"
    audit = client.get(audit_path, headers=owner_headers)
    assert audit.status_code == 200
    assert [event["user_id"] for event in audit.json()["data"]] == [owner.id]
    assert client.get(audit_path, headers=member_headers).status_code == 404

    with test_sessions() as db:
        assert not db.get(SpaceWork, space.id).is_active
        assert not db.get(Document, doc_id).is_deleted
        versions = db.scalars(select(DocumentVersion).where(DocumentVersion.document_id == doc_id)).all()
        assert [version.content for version in versions] == ["initial"]


def test_audit_lists_names_and_paginates_inclusive_date_range(api, user_factory, auth_headers):
    client, test_sessions = api
    manager = user_factory("manager@example.com", "Gestor")
    other_manager = user_factory("other@example.com", "Gestor")
    space = create_space(test_sessions, manager, "Team")
    other_space = create_space(test_sessions, other_manager, "Other team")
    document_id = create_document(client, manager, auth_headers, space.id)
    foreign_id = create_document(client, other_manager, auth_headers, other_space.id)

    with test_sessions() as db:
        timestamps = [
            datetime(2020, 1, 9, 23, 59, 59),
            datetime(2020, 1, 10),
            datetime(2020, 1, 10, 23, 59, 59),
            datetime(2020, 1, 11),
        ]
        events = [
            AuditLog(
                user_id=manager.id,
                space_work_id=space.id,
                action="document.updated",
                entity_type="document",
                entity_id=document_id,
                created_at=timestamp,
            )
            for timestamp in timestamps
        ]
        unresolved_resource = AuditLog(
            space_work_id=space.id,
            action="document.updated",
            entity_type="document",
            entity_id=foreign_id,
            created_at=timestamps[2],
        )
        db.add_all([
            *events,
            unresolved_resource,
            AuditLog(
                user_id=other_manager.id,
                space_work_id=other_space.id,
                action="document.updated",
                entity_type="document",
                entity_id=foreign_id,
                created_at=timestamps[2],
            ),
        ])
        db.commit()
        expected_ids = [unresolved_resource.id, events[2].id, events[1].id]

    params = {
        "space_work_id": space.id,
        "start_date": "2020-01-10",
        "end_date": "2020-01-10",
        "action": "document.updated",
        "limit": 2,
    }
    headers = auth_headers(manager)
    first = client.get("/audit", headers=headers, params=params)
    assert first.status_code == 200, first.text
    first_page = first.json()
    assert first_page["success"] is True
    assert first_page["pagination"] == {"total": 3, "limit": 2, "offset": 0}
    assert [entry["id"] for entry in first_page["data"]] == expected_ids[:2]
    unresolved, edit = first_page["data"]
    assert unresolved["actor_name"] is None and unresolved["resource_name"] is None
    assert edit["actor_name"] == manager.name
    assert edit["resource_name"] == "Test document"

    second = client.get("/audit", headers=headers, params={**params, "offset": 2}).json()
    assert second["pagination"] == {"total": 3, "limit": 2, "offset": 2}
    assert [entry["id"] for entry in second["data"]] == expected_ids[2:]
    empty = client.get("/audit", headers=headers, params={**params, "offset": 4}).json()
    assert empty["pagination"]["total"] == 3 and empty["data"] == []
    invalid = client.get("/audit", headers=headers, params={**params, "start_date": "2020-01-11"})
    assert invalid.status_code == 400 and invalid.json()["code"] == "bad_request"


def test_invitation_acceptance_adds_member_and_is_audited(api, user_factory, auth_headers, add_member):
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

    invitee_spaces = client.get("/space_work", headers=auth_headers(invitee))
    assert invitee_spaces.status_code == 200
    assert [space["id"] for space in invitee_spaces.json()["data"]] == [space_id]

    owner_members = client.get(f"/space_work/{space_id}/members", headers=auth_headers(manager))
    assert owner_members.status_code == 200
    assert {member["email"] for member in owner_members.json()["data"]} >= {
        manager.email,
        invitee.email,
    }

    regular_member = user_factory("regular-member@example.com")
    add_member(space_id, regular_member.id)
    hidden_members = client.get(f"/space_work/{space_id}/members", headers=auth_headers(regular_member))
    assert hidden_members.status_code == 404

    document_id = create_document(client, manager, auth_headers, space_id)
    grant_admin = client.put(
        f"/documents/{document_id}/permissions/{invitee.id}",
        headers=auth_headers(manager),
        json={"permission": "admin"},
    )
    assert grant_admin.status_code == 200
    admin_members = client.get(f"/space_work/{space_id}/members", headers=auth_headers(invitee))
    assert admin_members.status_code == 200

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


def test_global_errors_have_consistent_payload_and_are_in_openapi(api, user_factory, auth_headers):
    client, test_sessions = api
    manager = user_factory("global-errors@example.com", "Gestor")

    unauthorized = client.get("/documents?space_work_id=1")
    assert unauthorized.status_code == 401
    assert unauthorized.json()["success"] is False
    assert unauthorized.json()["code"] == "unauthorized"
    assert "detail" not in unauthorized.json()

    missing = client.get("/documents/987654", headers=auth_headers(manager))
    assert missing.status_code == 404
    assert missing.json()["code"] == "not_found"

    invalid = client.post("/auth/login", json={"email": "invalid-email", "password": "x"})
    assert invalid.status_code == 422
    assert invalid.json()["code"] == "validation_error"
    assert invalid.json()["details"][0]["field"] == "body.email"

    schema = client.get("/openapi.json").json()
    assert "/documents/{document_id}" in schema["paths"]
    assert "ApiErrorResponse" in schema["components"]["schemas"]
    assert "summary" in schema["paths"]["/documents"]["post"]


def test_permission_member_and_invitation_access_can_be_revoked_and_audited(
    api, user_factory, auth_headers
):
    client, test_sessions = api
    manager = user_factory("revoke-owner@example.com", "Gestor")
    member = user_factory("revoke-member@example.com")
    invitee = user_factory("cancel-invitee@example.com")

    space_response = client.post(
        "/space_work/create",
        headers=auth_headers(manager),
        json={"name": "Revocation space", "description": "test"},
    )
    space_id = space_response.json()["data"]["id"]

    member_invitation = client.post(
        "/invitations/create",
        headers=auth_headers(manager),
        json={"space_work_id": space_id, "email": member.email},
    ).json()["data"]
    accepted = client.post(
        "/invitations/accept",
        headers=auth_headers(member),
        json={"token": member_invitation["token"]},
    )
    assert accepted.status_code == 200

    document_id = create_document(client, manager, auth_headers, space_id)
    assignment = client.put(
        f"/documents/{document_id}/permissions/{member.id}",
        headers=auth_headers(manager),
        json={"permission": "read"},
    )
    assert assignment.status_code == 200

    revoked = client.delete(
        f"/documents/{document_id}/permissions/{member.id}",
        headers=auth_headers(manager),
    )
    assert revoked.status_code == 200, revoked.text
    assert client.get(f"/documents/{document_id}", headers=auth_headers(member)).status_code == 404

    invitee_invitation = client.post(
        "/invitations/create",
        headers=auth_headers(manager),
        json={"space_work_id": space_id, "email": invitee.email},
    ).json()["data"]
    pending = client.get(
        f"/invitations?space_work_id={space_id}",
        headers=auth_headers(manager),
    )
    assert pending.status_code == 200
    assert invitee_invitation["id"] in {item["id"] for item in pending.json()["data"]}

    cancelled = client.delete(
        f"/invitations/{invitee_invitation['id']}",
        headers=auth_headers(manager),
    )
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["data"]["status"] == "Cancelled"

    reassigned = client.put(
        f"/documents/{document_id}/permissions/{member.id}",
        headers=auth_headers(manager),
        json={"permission": "read"},
    )
    assert reassigned.status_code == 200
    removed = client.delete(
        f"/space_work/{space_id}/members/{member.id}",
        headers=auth_headers(manager),
    )
    assert removed.status_code == 200, removed.text
    assert client.get(f"/documents/{document_id}", headers=auth_headers(member)).status_code == 404
    assert client.get("/space_work", headers=auth_headers(member)).json()["data"] == []

    with test_sessions() as db:
        membership = db.scalar(select(SpaceWorkUser).where(
            SpaceWorkUser.space_work_id == space_id,
            SpaceWorkUser.user_id == member.id,
        ))
        assignment = db.scalar(select(PermissionDocumentUser.id).where(
            PermissionDocumentUser.space_work_id == space_id,
            PermissionDocumentUser.user_id == member.id,
        ))
        actions = set(db.scalars(select(AuditLog.action).where(AuditLog.space_work_id == space_id)).all())

    assert membership is not None and membership.is_active is False
    assert assignment is None
    assert {
        "document.permission_revoked",
        "invitation.cancelled",
        "space_work.member_removed",
    } <= actions
