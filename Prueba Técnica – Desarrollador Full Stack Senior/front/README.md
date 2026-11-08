# DocSpace frontend

Aplicación React con TypeScript, Vite y una estructura organizada por funcionalidades.

## Ejecutar

```powershell
npm install
npm run dev
```

Configura la URL del backend en un archivo `.env` a partir de `.env.example`.

## Estructura

```text
src/
  app/                         # composición de la aplicación, rutas y proveedores
  features/
    auth/                      # registro, inicio y cierre de sesión
    workspaces/                # espacios de trabajo y miembros
    documents/                 # documentos y editor
    permissions/               # permisos por documento
    versions/                  # historial, comparación y restauración
    audit/                     # consulta de la bitácora
      api/ components/ hooks/ pages/ schemas/ types/
  shared/
    api/                       # cliente HTTP común
    components/ hooks/ schemas/ types/ utils/
  main.tsx
```

Cada funcionalidad tiene carpetas `api`, `components`, `hooks`, `pages`, `schemas` y `types`. Se pueden quitar las que sigan vacías si la funcionalidad no las necesita.

## Convenciones

- `shared/api/client.ts` configura Axios una sola vez. Los archivos `api/*.api.ts` de cada funcionalidad contienen funciones para sus endpoints; por ejemplo, `documents.api.ts`.
- `hooks/` guarda hooks cuando hay lógica de estado o carga que una página necesita reutilizar. No hace falta crear un hook por cada componente o endpoint.
- `components/` contiene partes de interfaz propias de esa funcionalidad; `pages/` compone las vistas que se conectan a las rutas.
- `schemas/` contiene validaciones de formularios cuando se incorpore una librería de validación; `types/` contiene tipos propios de la funcionalidad.
- `shared/` es para piezas que realmente se reutilicen entre funcionalidades. La lógica de negocio específica se queda junto a su funcionalidad.
- No se crea una capa `service.ts` por defecto. En el frontend, las funciones HTTP viven en `api`; los hooks coordinan la interacción con React. Si más adelante la lógica de datos crece, se puede incorporar TanStack Query sin reorganizar las funcionalidades.

## Colaboración en tiempo real

El editor Tiptap se conecta al WebSocket del documento a través del proxy de Vite. Los cambios se sincronizan en un borrador compartido. **Guardar versión** crea una entrada de historial y auditoría con el contenido sincronizado. Quienes tienen lectura reciben los cambios y los avisos de guardado.

En la carpeta `backend`, aplica la migración del borrador antes de iniciar la API.

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
```

Con la API en ejecución, abre el mismo documento desde dos sesiones con permisos distintos. Escribe desde la cuenta con edición, comprueba que la otra recibe el cambio y pulsa **Guardar versión** para comprobar el aviso y el historial.
