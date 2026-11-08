import pytest


@pytest.mark.parametrize(
    ("role", "can_create", "create_status"),
    [("Gestor", True, 201), ("Colaborador", False, 403)],
)
def test_workspace_creation_permission(api, user_factory, auth_headers, role, can_create, create_status):
    client, _ = api
    headers = auth_headers(user_factory("workspace@example.com", role))
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
        assert client.get("/space_work", headers=headers).json()["data"] == [workspace]


@pytest.mark.parametrize("name", ["   ", "a" * 151])
def test_workspace_rejects_invalid_name(api, user_factory, auth_headers, name):
    client, _ = api
    headers = auth_headers(user_factory("manager@example.com", "Gestor"))
    response = client.post("/space_work/create", headers=headers, json={"name": name})
    assert response.status_code == 422
