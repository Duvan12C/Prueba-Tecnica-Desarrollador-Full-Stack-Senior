from typing import Literal

from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    role_name: Literal["Gestor", "Colaborador"]


class UserCreateResponse(BaseModel):
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)
