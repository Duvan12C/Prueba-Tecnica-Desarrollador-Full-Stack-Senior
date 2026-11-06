from app.modules.users.schemas import UserCreateRequest, UserCreateResponse
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.core.security import hash_password


class UserService:

    def __init__(self, repository: UserRepository):
        self.repository = repository

    def create_user(self, data: UserCreateRequest) -> UserCreateResponse:

        email = str(data.email).lower()
        if self.repository.email_exists(email):
            raise ValueError("Ya existe una cuenta con ese correo")

        role = self.repository.get_role_by_name(data.role_name)
        if role is None:
            raise ValueError("El rol solicitado no está configurado")

        user = User(
            name=data.name,
            email=email,
            password_hash=hash_password(data.password),
            rol_id=role.id
        )

        created_user = self.repository.create(user)

        return UserCreateResponse.model_validate(created_user)
