# DocSpace

DocSpace permite que un equipo organice documentos de texto por espacio de trabajo. Cada documento tiene su propio historial y sus permisos por usuario. Los Gestores pueden crear espacios, invitar cuentas registradas, administrar sus documentos y consultar la auditoría. Los Colaboradores acceden a sus espacios y a los documentos que se les han compartido.

- `fase-1` contiene la base de registro, sesiones, espacios, invitaciones, permisos, documentos, versiones y auditoría.
- `fase-2` agrega edición compartida en tiempo real, presencia, manejo de conflictos y guardado explícito de versiones. También incluye una vista de Inicio para cada rol.

## Tecnologías

| Área | Herramientas y uso |
| --- | --- |
| Interfaz | React 19 y TypeScript para las vistas y el tipado. React Router define las rutas públicas y protegidas, con carga diferida de vistas. Vite desarrolla y compila el frontend. |
| Estilos | Tailwind CSS 4 y los colores definidos en `front/src/index.css`. Los formularios, botones, tarjetas y diálogos reutilizan componentes compartidos. Motion anima las transiciones e Iconify muestra los iconos. |
| Datos del frontend | Axios consume la API desde un cliente compartido. Los interceptores adjuntan el token de acceso y coordinan la renovación de sesión. Los hooks y el estado de React gestionan la lógica de cada funcionalidad. |
| Editor | Tiptap y StarterKit proporcionan el editor enriquecido. El navegador conecta el editor a la API por WebSocket mediante el proxy de Vite. |
| API | Python, FastAPI y Uvicorn. Pydantic valida los datos y Pydantic Settings carga la configuración local. FastAPI genera Swagger, ReDoc y el esquema OpenAPI. |
| Persistencia | SQL Server como base de la aplicación. SQLAlchemy gestiona las consultas y transacciones, pyodbc conecta con SQL Server y Alembic aplica las migraciones. |
| Autenticación | PyJWT firma y valida tokens Bearer. pwdlib con Argon2 protege las contraseñas. La renovación usa una cookie HttpOnly y sesiones revocables con vencimiento por inactividad y límite absoluto. |
| Verificación | pytest y FastAPI TestClient para la API, con SQLite temporal. TypeScript, Vite y Oxlint verifican el frontend. |

## Estructura

```text
.
├── README.md
├── PROCESO-AGENTES.md
├── docs/
│   ├── arquitectura-docspace.pdf
│   └── diagrama-er.png
└── Prueba Técnica – Desarrollador Full Stack Senior/
    ├── backend/
    │   ├── app/core/       Configuración, base de datos y seguridad
    │   ├── app/modules/    Módulos de negocio y canal colaborativo
    │   ├── app/shared/     Respuestas y errores comunes
    │   ├── migrations/     Esquema y datos iniciales
    │   └── tests/          Pruebas automatizadas
    └── front/
        └── src/
            ├── app/       Rutas y layouts
            ├── features/  Vistas, hooks, API y tipos por funcionalidad
            └── shared/    Cliente HTTP y componentes reutilizables
```

En el backend, los routers reciben las peticiones y aplican las dependencias de autenticación. Los servicios resuelven las reglas de negocio y los repositorios concentran las consultas. Las respuestas JSON usan el formato común `ApiResponse`. En el frontend, cada funcionalidad mantiene sus llamadas HTTP, hooks y componentes cerca de sus vistas.

El servidor verifica la membresía activa del espacio y el permiso sobre el documento en cada operación protegida. Los permisos son lectura, edición y administración. Una invitación da acceso al espacio una vez aceptada. El Gestor propietario y quien tenga administración sobre un documento pueden gestionar sus permisos. La restauración crea una nueva versión y la eliminación es lógica, con su evento de auditoría.

## Arrancar con Docker Compose

Necesitas Docker con Compose y contenedores Linux en un equipo x86-64. En Windows, abre Docker Desktop y espera a que el motor esté en ejecución. Compose prepara el frontend, la API, el controlador ODBC y SQL Server Developer en contenedores. [Requisitos de SQL Server en contenedores](https://learn.microsoft.com/en-us/sql/linux/quickstart-install-connect-docker)

En una instalación nueva, copia `.env.example` como `.env` en la raíz. Usa una contraseña robusta para `DOCSPACE_SQL_PASSWORD` y una clave aleatoria de al menos 32 bytes para `DOCSPACE_SECRET_KEY`. Si aceptas los términos de Microsoft para usar SQL Server Developer y su controlador, pon `DOCSPACE_ACCEPT_SQL_EULA=Y`. El archivo local `.env` está excluido de Git.

Desde la raíz del repositorio, arranca DocSpace con este comando.

```powershell
docker compose up --build
```

- [Aplicación](http://127.0.0.1:5173)
- [Swagger](http://127.0.0.1:8000/docs) · [ReDoc](http://127.0.0.1:8000/redoc)

En el primer arranque se descargan las imágenes, se crea la base `DocSpace` y se aplican las migraciones. Nginx sirve React y reenvía HTTP y WebSocket a FastAPI. El SQL Server de Compose usa un volumen propio y se comunica con la API por la red interna de Docker. Si ya tienes ocupados los puertos 5173 u 8000, puedes elegir otros con `DOCSPACE_WEB_PORT` y `DOCSPACE_API_PORT` en `.env`.

Para detener y retirar los contenedores, ejecuta `docker compose down` desde la raíz. Los datos permanecen en el volumen `sql_data`. Conserva la contraseña de SQL Server mientras reutilices ese volumen.

## Arranque manual en Windows

Verifiqué el proyecto con Python 3.12, Node.js 24 y npm. Para ejecutar la aplicación también se necesita una instancia de SQL Server accesible, una base vacía para una instalación nueva y un controlador ODBC de SQL Server instalado. El ejemplo usa el controlador ODBC 18. [Descarga oficial de Microsoft](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server?view=sql-server-ver18)

### Backend

Ejecuta estos comandos en PowerShell desde la raíz del repositorio.

```powershell
Set-Location -LiteralPath '.\Prueba Técnica – Desarrollador Full Stack Senior\backend'
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Crea `backend/app/.env` en tu copia local. El ejemplo supone SQL Server en `localhost` con autenticación de Windows y una base llamada `DocSpace`. Ajusta el servidor, la base y la autenticación a tu instancia.

```dotenv
DATABASE_URL=mssql+pyodbc://localhost/DocSpace?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes
SECRET_KEY=REEMPLAZA_CON_UNA_CLAVE_ALEATORIA_PROPIA
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SESSION_IDLE_MINUTES=30
SESSION_MAX_HOURS=8
SESSION_COOKIE_SECURE=false
```

Puedes generar el valor de `SECRET_KEY` con `.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"`. El archivo `.env` queda fuera de Git. `TrustServerCertificate=yes` y la cookie sin `Secure` corresponden al entorno local del ejemplo.

Con la base creada, aplica las migraciones desde `backend`. Estas crean el esquema y cargan los roles y permisos iniciales.

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
```

### Frontend

Abre otra terminal en la raíz del repositorio y prepara el frontend.

```powershell
Set-Location -LiteralPath '.\Prueba Técnica – Desarrollador Full Stack Senior\front'
npm ci
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
```

En una instalación nueva, deja `VITE_API_URL=http://127.0.0.1:8000` en `front/.env`. Si ya tienes un archivo `.env`, revisa ese valor directamente. El proxy de Vite reenvía tanto HTTP como WebSocket bajo `/api`.

### Iniciar los servicios manualmente

El arranque actual usa dos terminales. Desde `backend`, ejecuta la API con un solo proceso para compartir la presencia de todos los clientes.

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Inicia la interfaz desde `front`.

```powershell
npm run dev -- --host localhost --port 5173 --strictPort
```

- [Aplicación](http://localhost:5173)
- [Swagger](http://127.0.0.1:8000/docs), [ReDoc](http://127.0.0.1:8000/redoc) y [OpenAPI](http://127.0.0.1:8000/openapi.json)

## Cuentas de demostración

Con DocSpace en ejecución en Docker, crea las dos cuentas desde la raíz del repositorio.

```powershell
docker compose exec -T api python -m app.cli.seed_demo
```

El comando registra las cuentas a través de la API. Si lo ejecutas otra vez, conserva las cuentas existentes y sus contraseñas. Estas credenciales son para una demo local. Si usas el arranque manual, puedes ejecutar `.\.venv\Scripts\python.exe -m app.cli.seed_demo` desde `backend` con la API local en ejecución.

| Rol | Correo | Contraseña de ejemplo |
| --- | --- | --- |
| Gestor | gestor.demo@example.com | `DocSpace-Demo@2026` |
| Colaborador | colaborador.demo@example.com | `DocSpace-Demo@2026` |

1. Entra como Gestor, crea un espacio y envía una invitación al Colaborador.
2. Abre otro perfil de navegador, entra como Colaborador y acepta la invitación desde la bandeja.
3. Como Gestor, crea un documento y asigna permiso de **Edición** al Colaborador desde los permisos del documento.
4. Abre el documento en las dos sesiones. Comprueba la presencia y escribe desde una sesión. El cambio aparece en la otra como borrador.
5. Pulsa **Guardar versión**. Revisa el aviso en la otra sesión y comprueba la nueva entrada en el historial. Desde ahí puedes comparar y restaurar versiones. Como Gestor, abre **Auditoría** para ver la acción registrada.
6. Cambia el permiso del Colaborador a **Lectura** y vuelve a abrir el documento para comprobar que recibe cambios con el editor bloqueado.

## Ejecutar las pruebas

Si usas Docker, ejecuta la suite desde la raíz. El contenedor de pruebas usa SQLite temporal y puede ejecutarse con los servicios apagados.

```powershell
docker compose run --build --rm --no-deps -e DATABASE_URL=sqlite+pysqlite:// api python -m pytest -q
```

Para el entorno manual, ejecuta la suite desde `backend` con las dependencias instaladas.

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

La suite crea bases SQLite temporales. Si solo quieres ejecutar pruebas y todavía no tienes `app/.env`, define una vez las variables `$env:DATABASE_URL = 'sqlite+pysqlite://'` y `$env:SECRET_KEY = 'clave-local-exclusiva-para-pruebas'` en esa terminal. La suite comprueba sesiones, aislamiento entre espacios, invitaciones, permisos, guardado, comparación, restauración, auditoría y edición compartida.

Ejecuta la compilación y el análisis estático desde `front`.

```powershell
npm run build
npm run lint
```

## Colaboración y entrega

El servidor mantiene un borrador por documento y valida la revisión que envía cada editor. Si dos ediciones parten de la misma revisión, se aplica la primera válida. La otra persona conserva su borrador para compararlo y decidir cómo incorporarlo. **Guardar versión** publica el borrador, registra una versión y la audita cuando hay cambios por guardar. La presencia y los avisos se coordinan en el proceso de la API.

- [Documento de arquitectura](docs/arquitectura-docspace.pdf)
- [Diagrama entidad-relación de la Fase 1](docs/diagrama-er.png). La [migración de borradores de la Fase 2](Prueba%20T%C3%A9cnica%20%E2%80%93%20Desarrollador%20Full%20Stack%20Senior/backend/migrations/versions/b539a781df62_add_document_drafts.py) describe el cambio posterior en el esquema.
- [Proceso con agentes en la Fase 2](PROCESO-AGENTES.md)

## Uso de IA en la Fase 1

La arquitectura del proyecto, el diseño de la base de datos y la elección de las librerías del frontend y del backend fueron decisiones mías. Durante la Fase 1 recurrí a la IA como apoyo puntual en la implementación porque disponía principalmente de las noches para avanzar. También consulté documentación de Python para entender cómo funcionaba el código. Dejo constancia de este uso porque el enunciado reservaba la asistencia de IA para la Fase 2.
