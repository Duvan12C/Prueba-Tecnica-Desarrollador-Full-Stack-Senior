from app.modules.users.models import User


def test_workspace_manager_can_invite_registered_users_in_batch(api, user_factory, auth_headers):
    client, sessions = api
    manager = user_factory("team-manager@example.com", "Gestor")
    first = user_factory("team-first@example.com")
    second = user_factory("team-second@example.com")
    inactive = user_factory("team-inactive@example.com")
    outsider = user_factory("outsider@example.com")
    with sessions() as db:
        db.get(User, inactive.id).is_active = False
        db.commit()

    manager_headers = auth_headers(manager)
    first_headers = auth_headers(first)
    second_headers = auth_headers(second)
    outsider_headers = auth_headers(outsider)
    space = client.post("/space_work/create", headers=manager_headers, json={"name": "Equipo"}).json()["data"]
    space_id = space["id"]
    document = client.post("/documents", headers=manager_headers, json={
        "space_work_id": space_id, "title": "Privado",
    }).json()["data"]
    search_params = {"space_work_id": space_id, "q": "TEAM-"}

    search = client.get("/invitations/candidates", headers=manager_headers, params=search_params)
    assert search.status_code == 200
    assert {candidate["id"] for candidate in search.json()["data"]} == {first.id, second.id}
    assert client.get("/invitations/candidates", headers=outsider_headers, params=search_params).status_code == 403
    assert client.post("/invitations/send", headers=outsider_headers, json={
        "space_work_id": space_id, "user_ids": [first.id],
    }).status_code == 403

    invalid_batch = client.post("/invitations/send", headers=manager_headers, json={
        "space_work_id": space_id, "user_ids": [first.id, inactive.id, 99999],
    })
    assert invalid_batch.status_code == 409
    assert client.get("/invitations/received", headers=first_headers).json()["data"] == []

    sent = client.post("/invitations/send", headers=manager_headers, json={
        "space_work_id": space_id, "user_ids": [first.id, second.id, first.id],
    })
    assert sent.status_code == 201
    assert sent.json()["data"] == {"sent_count": 2}
    assert client.get("/invitations/candidates", headers=manager_headers, params=search_params).json()["data"] == []

    first_inbox = client.get("/invitations/received", headers=first_headers).json()["data"]
    second_inbox = client.get("/invitations/received", headers=second_headers).json()["data"]
    assert len(first_inbox) == len(second_inbox) == 1
    assert first_inbox[0]["workspace_name"] == "Equipo"
    assert first_inbox[0]["inviter_name"] == manager.name
    assert "token" not in first_inbox[0]
    assert client.get("/invitations/received", headers=outsider_headers).json()["data"] == []

    accept_url = f"/invitations/{first_inbox[0]['id']}/accept"
    assert client.post(accept_url, headers=second_headers).status_code == 404
    assert client.post(accept_url, headers=first_headers).status_code == 200
    assert client.post(accept_url, headers=first_headers).status_code == 409
    assert client.get("/invitations/received", headers=first_headers).json()["data"] == []
    assert client.get("/space_work", headers=first_headers).json()["data"] == [space]
    assert client.get("/documents", headers=first_headers, params={"space_work_id": space_id}).json()["data"] == []
    assert client.get(f"/documents/{document['id']}", headers=first_headers).status_code == 404


def test_link_invitation_rejects_an_unregistered_email(api, user_factory, auth_headers):
    client, _ = api
    headers = auth_headers(user_factory("manager@example.com", "Gestor"))
    space = client.post("/space_work/create", headers=headers, json={"name": "Equipo"}).json()["data"]
    response = client.post("/invitations/create", headers=headers, json={
        "space_work_id": space["id"], "email": "unknown@example.com",
    })

    assert response.status_code == 409
