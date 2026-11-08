import pytest


@pytest.mark.parametrize(
    ("role", "can_create", "create_status"),
    [("Gestor", True, 201), ("Colaborador", False, 403)],
)
def test_workspace_creation_permission(api, user_factory, auth_headers, role, can_create, create_status):
    client, _ = api
    user = user_factory("workspace@example.com", role)
    headers = auth_headers(user)
    assert client.get("/space_work", headers=headers).json()["data"] == []

    capabilities = client.get("/space_work/capabilities", headers=headers)
    assert capabilities.status_code == 200
    assert capabilities.json()["data"] == {"can_create": can_create}

    created = client.post("/space_work/create", headers=headers, json={"name": "  Equipo de Producto  "})
    assert created.status_code == create_status
    if can_create:
        workspace = created.json()["data"]
        assert workspace["name"] == "Equipo de Producto"
        assert workspace["description"] is None
        assert workspace["icon_key"] == "folder"
        assert workspace["color_key"] == "blue"
        assert client.get("/space_work", headers=headers).json()["data"] == [
            {**workspace, "member_summary": {"count": 1, "names": [user.name]}}
        ]


@pytest.mark.parametrize("name", ["   ", "a" * 151])
def test_workspace_rejects_invalid_name(api, user_factory, auth_headers, name):
    client, _ = api
    headers = auth_headers(user_factory("manager@example.com", "Gestor"))
    response = client.post("/space_work/create", headers=headers, json={"name": name})
    assert response.status_code == 422


def test_workspace_persists_appearance(api, user_factory, auth_headers):
    client, _ = api
    user = user_factory("manager@example.com", "Gestor")
    headers = auth_headers(user)
    response = client.post(
        "/space_work/create",
        headers=headers,
        json={"name": "Proyecto", "icon_key": "rocket", "color_key": "green"},
    )

    assert response.status_code == 201
    workspace = response.json()["data"]
    assert (workspace["icon_key"], workspace["color_key"]) == ("rocket", "green")
    assert client.get("/space_work", headers=headers).json()["data"] == [
        {**workspace, "member_summary": {"count": 1, "names": [user.name]}}
    ]


@pytest.mark.parametrize("field", ["icon_key", "color_key"])
def test_workspace_rejects_unknown_appearance_keys(api, user_factory, auth_headers, field):
    client, _ = api
    headers = auth_headers(user_factory("manager@example.com", "Gestor"))
    response = client.post("/space_work/create", headers=headers, json={"name": "Proyecto", field: "unknown"})

    assert response.status_code == 422
    assert client.get("/space_work", headers=headers).json()["data"] == []
