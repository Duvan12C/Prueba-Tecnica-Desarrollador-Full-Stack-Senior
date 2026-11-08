from app.modules.users.schemas import UserCreateRequest, UserCreateResponse, UserProfileResponse
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.core.security import hash_password
from app.shared.exceptions import BadRequestError, ConflictError, ResourceNotFoundError


class UserService:

    def __init__(self, repository: UserRepository):
        self.repository = repository

    def get_profile(self, user: User) -> UserProfileResponse:
        role_name = self.repository.get_role_name(user.rol_id)
        if role_name is None:
            raise ResourceNotFoundError("No se pudo consultar el rol de la cuenta")
        return UserProfileResponse(name=user.name, role_name=role_name)

    def create_user(self, data: UserCreateRequest) -> UserCreateResponse:

        email = str(data.email).lower()
        if self.repository.email_exists(email):
            raise ConflictError("Ya existe una cuenta con ese correo")

        role = self.repository.get_role_by_name(data.role_name)
        if role is None:
            raise BadRequestError("El rol solicitado no está configurado")

        user = User(
            name=data.name,
            email=email,
            password_hash=hash_password(data.password),
            rol_id=role.id
        )

        created_user = self.repository.create(user)

        return UserCreateResponse.model_validate(created_user)
