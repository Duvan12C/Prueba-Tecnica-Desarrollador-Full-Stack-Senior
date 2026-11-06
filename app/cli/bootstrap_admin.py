"""Create the first DocSpace Gestor from environment-provided credentials.

Run after migrations with:
    python -m app.cli.bootstrap_admin

Required variables: BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD.
The password is never stored in the repository or printed by this command.
"""

import os
import sys
from getpass import getpass

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.modules.users.models import Role, User


def main() -> int:
    email = os.getenv("BOOTSTRAP_ADMIN_EMAIL", "").strip().lower()
    if not email:
        email = input("Correo del Gestor inicial: ").strip().lower()

    password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")
    if not password:
        password = getpass("Contraseña inicial (mínimo 12 caracteres): ")
        confirmation = getpass("Confirma la contraseña: ")
        if password != confirmation:
            print("Las contraseñas no coinciden.", file=sys.stderr)
            return 2

    name = os.getenv("BOOTSTRAP_ADMIN_NAME", "Administrador inicial").strip()

    if not email or "@" not in email or not password:
        print("Debes proporcionar un correo válido y una contraseña.", file=sys.stderr)
        return 2
    if len(password) < 12:
        print("BOOTSTRAP_ADMIN_PASSWORD debe tener al menos 12 caracteres.", file=sys.stderr)
        return 2

    with SessionLocal() as db:
        existing = db.scalar(select(User).where(User.email == email))
        if existing is not None:
            print("La cuenta ya existe; no se realizaron cambios.")
            return 0

        gestor_role = db.scalar(select(Role).where(Role.name == "Gestor"))
        if gestor_role is None:
            print("No existe el rol Gestor. Ejecuta primero las migraciones.", file=sys.stderr)
            return 2

        user = User(
            name=name or "Administrador inicial",
            email=email,
            password_hash=hash_password(password),
            rol_id=gestor_role.id,
        )
        db.add(user)
        db.commit()
        print(f"Cuenta Gestor inicial creada para {email}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
