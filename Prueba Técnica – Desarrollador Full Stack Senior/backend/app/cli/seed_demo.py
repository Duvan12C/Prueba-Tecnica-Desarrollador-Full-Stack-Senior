from http import HTTPStatus

import httpx


DEMO_PASSWORD = "DocSpace-Demo@2026"
DEMO_ACCOUNTS = (
    ("Gestor Demo", "gestor.demo@example.com", "Gestor"),
    ("Colaborador Demo", "colaborador.demo@example.com", "Colaborador"),
)


def main() -> None:
    with httpx.Client(base_url="http://127.0.0.1:8000", timeout=10, trust_env=False) as client:
        for name, email, role in DEMO_ACCOUNTS:
            response = client.post("/users/create", json={
                "name": name,
                "email": email,
                "password": DEMO_PASSWORD,
                "role_name": role,
            })
            if response.status_code == HTTPStatus.CONFLICT:
                print(f"Cuenta existente conservada: {email}")
                continue
            response.raise_for_status()
            print(f"Cuenta de demostración creada: {email} ({role})")


if __name__ == "__main__":
    main()
