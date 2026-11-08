from fastapi import FastAPI

from app.core.exceptions import register_exception_handlers
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.spaceswork.router import router as spaceswork_router
from app.modules.invitations.router import router as invitations_router
from app.modules.documents.router import router as documents_router
from app.modules.audit.router import router as audit_router
from app.modules.collaboration.router import router as collaboration_router


app = FastAPI(
    title="DocSpace API",
    version="1.0.0",
    summary="API de espacios y documentos colaborativos",
    description=(
        "DocSpace es una API para gestionar documentos y espacios de trabajo colaborativos. "
        "Permite registrar usuarios, crear espacios de trabajo, gestionar invitaciones "
        "y compartir documentos con permisos por usuario. Cada guardado crea una versión nueva; "
        "el historial incluye comparación y restauración. Las rutas protegidas usan tokens Bearer."
    ),
    openapi_tags=[
        {"name": "Authentication", "description": "Inicio de sesión y emisión de tokens Bearer."},
        {"name": "Users", "description": "Registro de cuentas Gestor y Colaborador."},
        {"name": "SpaceWork", "description": "Creación de espacios de trabajo por Gestores."},
        {"name": "Invitations", "description": "Invitación de usuarios y aceptación con token."},
        {"name": "Documents", "description": "Documentos, permisos y control de versiones."},
        {"name": "Audit", "description": "Consulta paginada de acciones auditadas por espacio."},
    ],
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
app.include_router(collaboration_router)

register_exception_handlers(app)
