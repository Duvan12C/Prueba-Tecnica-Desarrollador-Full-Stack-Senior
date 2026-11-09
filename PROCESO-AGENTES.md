# Proceso con agentes en DocSpace

## Punto de partida

La colaboración se desarrolló en `fase-2`, a partir del commit `5e112ae` de `fase-1`. La API ya tenía autenticación, permisos por documento, historial y auditoría. El editor existente usaba Tiptap.

## Agente y solicitudes

Usé Codex para revisar el flujo existente, proponer el diseño, implementar el canal y el editor compartido y ejecutar las pruebas. Estas fueron las instrucciones principales, resumidas en el orden de trabajo.

1. Implementar la Fase 2 sobre el proyecto existente. Respetar la arquitectura de la API y de React, separar responsabilidades, evitar comentarios innecesarios, consultar los cambios grandes o delicados y usar un commit descriptivo por bloque.
2. Permitir que varias cuentas vean los cambios del mismo documento en tiempo real y sepan quién está conectado. Mantener los permisos, el versionado y la auditoría de la Fase 1.
3. Tras revisar el guardado automático, explicar primero por qué se estaban creando versiones por unas pocas letras. Cambiarlo a edición compartida con guardado explícito y avisar a los demás cuando se publique una versión. Validar que el resto del flujo siga funcionando.
4. Documentar el proceso con el agente, las decisiones que se tomaron y cómo se comprobó el resultado.

## Decisiones y cambios de dirección

- **Aceptado.** Reutilizar FastAPI y Tiptap con un WebSocket por documento. El canal comprueba el acceso antes de enviar el borrador. Quien tiene lectura puede seguir los cambios y la presencia. Editar y publicar requiere edición o administración.
- **Descartado.** Crear una versión y un evento de auditoría por cada tanda de cambios. Al revisar la edición bidireccional, vi que escribir unas pocas letras podía dejar otra entrada en el historial y en la bitácora. Pedí cambiar ese comportamiento para que el historial reflejara los guardados explícitos.
- **Ajustado tras la revisión.** Separar el borrador del historial. El borrador se conserva en una sola fila por documento. **Guardar versión** publica los cambios pendientes, crea la versión y su evento de auditoría, y avisa a quienes están conectados.
- Si dos personas escriben sobre la misma revisión, el servidor acepta la primera edición válida y devuelve el estado actual a la segunda. Su borrador local se conserva y la persona puede comparar, ajustar y aplicar su contenido o usar el borrador compartido. Restaurar o guardar por REST un contenido distinto requiere publicar primero un borrador pendiente.
- La presencia y los avisos se distribuyen en un solo proceso de la API. El borrador vive en la base de datos y se recupera al volver a abrir el documento. La resolución de conflictos es manual.

Mi intervención en ese ajuste consistió en revisar el comportamiento, pedir el cambio y exigir que se conservara la arquitectura. Dirigí la implementación mediante instrucciones a Codex. Le pedí mantener el canal WebSocket y el editor existentes, conservar el borrador por separado y dejar la creación de versiones y la auditoría en los servicios correspondientes. Los commits `b4fdd20`, `0495797` y `e5682fa` separan el canal autenticado, el borrador persistente y su integración con el editor.

## Revisión y verificación

En mi revisión funcional, el cambio que solicité fue sobre cuándo se generaban las versiones y los eventos de auditoría. La sincronización bidireccional seguía funcionando. Durante la integración, las pruebas también permitieron detectar estos ajustes.

- En el primer cambio del backend, Codex colocó la versión base en la creación del documento. Las pruebas detectaron el error. Se movió esa validación al guardado, donde corresponde.
- La primera prueba de navegador inyectaba un token sin la cookie de renovación. Al escribir, el flujo normal de actividad intentaba renovar la sesión y regresaba al inicio de sesión. La prueba se corrigió iniciando sesión mediante la API en cada contexto de Chrome.
- Las 22 pruebas de la base de Fase 1 pasaron antes del cambio. La suite final pasó 24 pruebas y cubrió aislamiento, escritura denegada para lectores, conflictos, un solo registro de borrador, guardado explícito, aviso, auditoría y restauración.
- La compilación de React pasó. La prueba integrada usó tres sesiones aisladas de Chrome, Vite y FastAPI con una base SQLite temporal. Una cuenta de lectura recibió el cambio en 323 ms en la ejecución final. Se comprobó que la edición dejaba el historial intacto y que **Guardar versión** creaba una sola entrada con su evento de auditoría.
- La migración se probó sobre una base temporal con el esquema previo. Después se aplicó en SQL Server local y se verificó la revisión `b539a781df62`.

El [README global](README.md#ejecutar-las-pruebas) documenta el comando para repetir la suite. La [demo con dos sesiones](README.md#cuentas-de-demostración) permite repetir la verificación del editor desde la interfaz.
