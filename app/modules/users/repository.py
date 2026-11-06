from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.users.models import User, Role


class UserRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_role_by_name(self, role_name: str) -> Role | None:
        return self.db.scalar(select(Role).where(Role.name == role_name))

    def email_exists(self, email: str) -> bool:
        return self.db.scalar(select(User.id).where(User.email == email)) is not None

    def create(self, user: User) -> User:
        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)

            return user

        except IntegrityError as error:
            self.db.rollback()
            raise ValueError("Ya existe una cuenta con ese correo") from error
        except Exception:
            self.db.rollback()
            raise
