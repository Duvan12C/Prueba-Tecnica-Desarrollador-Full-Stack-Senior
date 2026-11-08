from typing import Literal

from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150, description="Nombre visible del usuario")
    email: EmailStr = Field(description="Correo que se usará para iniciar sesión")
    password: str = Field(min_length=12, max_length=128, description="Contraseña de al menos 12 caracteres")
    role_name: Literal["Gestor", "Colaborador"] = Field(
        description="Rol de la cuenta elegido durante el registro",
        examples=["Colaborador"],
    )


class UserCreateResponse(BaseModel):
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(BaseModel):
    name: str
    role_name: str
