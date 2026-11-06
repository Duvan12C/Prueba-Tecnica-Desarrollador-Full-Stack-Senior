from fastapi import FastAPI

from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.spaceswork.router import router as spaceswork_router
from app.modules.invitations.router import router as invitations_router
from app.modules.documents.router import router as documents_router
from app.modules.audit.router import router as audit_router


app = FastAPI(
    title="DocSpace API",
    description="API para la gestión colaborativa de documentos y espacios de trabajo.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)


# Registrar módulos
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(spaceswork_router)
app.include_router(invitations_router)
app.include_router(documents_router)
app.include_router(audit_router)