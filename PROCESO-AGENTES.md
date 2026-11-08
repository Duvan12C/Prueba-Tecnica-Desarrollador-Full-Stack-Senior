# Proceso con agentes en DocSpace

## Punto de partida

La colaboración se desarrolló en `fase-2`, a partir del commit `5e112ae` de `fase-1`. La API ya tenía autenticación, permisos por documento, historial y auditoría. El editor existente usaba Tiptap.

## Agente e instrucciones

Usé Codex para revisar los requisitos, proponer el diseño, implementar el canal y el editor compartido y ejecutar pruebas. La instrucción fue respetar la separación de responsabilidades del proyecto, consultar antes de cambios grandes o delicados y guardar cada bloque en un commit descriptivo.

## Decisiones y cambios de dirección

- Aprobé reutilizar FastAPI y Tiptap con un WebSocket por documento y controlar la concurrencia mediante una revisión enviada por el cliente. El canal comprueba el acceso antes de enviar el borrador. Solo quien tiene edición o administración puede modificarlo o publicar una versión.
- La primera propuesta guardaba una versión por cada tanda de cambios. Pedí separar el borrador del historial para que unas cuantas letras no generaran copias completas del documento. El borrador se conserva en una sola fila por documento. El historial y la auditoría se actualizan al pulsar **Guardar versión**. Los demás reciben un aviso.
- Si dos personas escriben sobre la misma revisión, el servidor acepta la primera edición válida y devuelve el estado actual a la segunda. Su borrador local se conserva y la persona puede comparar, ajustar y aplicar su contenido o usar el borrador compartido. Restaurar o guardar por REST un contenido distinto requiere publicar primero un borrador pendiente.
- La presencia y los avisos se distribuyen en un solo proceso de la API. El borrador vive en la base de datos y se recupera al volver a abrir el documento. La resolución de conflictos es manual.

## Errores detectados y verificación

- En el primer cambio del backend, Codex colocó la versión base en la creación del documento. Las pruebas detectaron el error. Se movió esa validación al guardado, donde corresponde.
- La primera prueba de navegador inyectaba un token sin la cookie de renovación. Al escribir, el flujo normal de actividad intentaba renovar la sesión y regresaba al inicio de sesión. La prueba se corrigió iniciando sesión mediante la API en cada contexto de Chrome.
- Las 22 pruebas de la base de Fase 1 pasaron antes del cambio. La suite final pasó 24 pruebas y cubrió aislamiento, escritura denegada para lectores, conflictos, un solo registro de borrador, guardado explícito, aviso, auditoría y restauración.
- La compilación de React pasó. La prueba integrada usó tres sesiones aisladas de Chrome, Vite y FastAPI con una base SQLite temporal. Una cuenta de lectura recibió el cambio en 323 ms en la ejecución final. Se comprobó que la edición dejaba el historial intacto y que **Guardar versión** creaba una sola entrada con su evento de auditoría.
- La migración se probó sobre una base temporal con el esquema previo. Después se aplicó en SQL Server local y se verificó la revisión `b539a781df62`.

Para repetir la suite, ejecuta el siguiente comando desde `backend`.

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```
