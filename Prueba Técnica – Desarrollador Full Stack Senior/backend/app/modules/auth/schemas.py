from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr = Field(description="Correo de la cuenta registrada", examples=["gestor@docspace.test"])
    password: str = Field(description="Contraseña de la cuenta")

class TokenResponse(BaseModel):
    access_token: str = Field(description="Token JWT para enviar en Authorization: Bearer")
    token_type: str = Field(default="bearer", description="Esquema de autenticación del token")
