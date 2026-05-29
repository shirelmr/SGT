# Plan de Calidad — SGT Talk!

> **Proyecto:** SGT — Sistema de Gestión Talk!  
> **Equipo:** AIAS · Shirel Marino Ramírez · Arístides Nieto Guzmán · Ana Paola Oviedo Salgado · Itzel Covarrubias Basurto  
> **Curso:** TC3004B Planeación de Sistemas de Software · Semestre Enero–Junio 2026  
> **Responsable QA:** Shirel Marino Ramirez
> **Última actualización:** 28 de mayo de 2026 · Semana 14

---

## Índice

0. [Objetivos y Criterios de Calidad Generales](#0-objetivos-y-criterios-de-calidad-generales)
0. [Roles y Responsabilidades Formales](#0-roles-y-responsabilidades-formales)
1. [Gestión de Riesgos](#1-gestión-de-riesgos)
2. [Casos de Pruebas Funcionales](#2-casos-de-pruebas-funcionales)
3. [Evaluación Heurística — Nielsen](#3-evaluación-heurística--nielsen)
4. [Sesiones de Prueba con Usuarios](#4-sesiones-de-prueba-con-usuarios)

---

## 0. Objetivos y Criterios de Calidad Generales

Esta sección define qué significa calidad para SGT y cómo se evaluará de forma transversal en todo el proyecto.

### 0.1 Objetivo General

Garantizar que SGT sea usable, seguro y confiable para la operación del programa Talk!, permitiendo ejecutar los flujos críticos por rol (beneficiario, tutor, revisor y coordinador) sin errores bloqueantes.

### 0.2 Atributos Prioritarios y Métricas Globales

| Atributo | Criterio de calidad | Métrica global | Meta |
|----------|----------------------|----------------|------|
| Usabilidad | Los usuarios completan tareas clave sin asistencia | % de tareas completadas en sesiones con usuarios + ICH Nielsen | ICH >= 80% y >= 80% de tareas completadas |
| Funcionalidad | Los flujos de negocio funcionan según lo esperado | % de casos funcionales en estado `✅ Pasa` | >= 80% de casos funcionales en `✅ Pasa` |
| Seguridad (acceso) | Solo usuarios autorizados acceden a módulos por rol | Casos de autenticación/autorización aprobados | 100% de pruebas críticas de auth y rutas privadas aprobadas |
| Confiabilidad | El sistema responde correctamente ante errores comunes | Cobertura de casos negativos (validaciones y errores API) | Casos negativos críticos cubiertos y sin defectos bloqueantes abiertos |
| Rendimiento operativo | El sistema mantiene respuesta aceptable en uso esperado | Tiempo de respuesta percibido y pruebas de carga planificadas | Cumplir objetivo de prueba de carga definida para S11-S12 |

### 0.3 Criterio de Liberación de Calidad

El MVP se considera apto para liberación únicamente si:

1. Se cumple el umbral global de pruebas funcionales (`>= 80%` en `✅ Pasa`).
2. No existen defectos críticos abiertos en autenticación, autorización o flujos principales.
3. La evaluación heurística cumple la meta mínima definida (`ICH >= 80%`).

## 0. Roles y Responsabilidades Formales

### 0.1 Responsables por Proceso de Calidad

| Proceso de calidad | Responsable |
|--------------------|-------------|
| Gestión de riesgos | Arístides Nieto Guzmán |
| Casos de pruebas funcionales | Shirel Marino Ramírez |
| Evaluación heurística | Ana Paola Oviedo Salgado |
| Sesiones de prueba con usuarios | Itzel Covarrubias Basurto |

### 0.2 Matriz RACI (resumen)

| Actividad | Arístides | Shirel | Ana Paola | Itzel |
|-----------|:---------:|:------:|:---------:|:-----:|
| Gestión de riesgos | A/R | C | C | I |
| Casos de pruebas funcionales | C | A/R | I | I |
| Evaluación heurística | I | C | A/R | C |
| Sesiones de prueba con usuarios | I | C | C | A/R |

> R = Responsible, A = Accountable, C = Consulted, I = Informed.


## 1. Gestión de Riesgos

> **Instrucciones de actualización:** Este registro se revisa al cierre de cada sprint. El Responsable QA actualiza el estado y el factor de riesgo. Si algún riesgo cambia de probabilidad o impacto, agrega una nueva fila con la fecha de actualización en lugar de sobrescribir la anterior.  
> **Factor de Riesgo** = Probabilidad × Impacto  (escala: Baja=1, Media=2, Alta=3 · Bajo=1, Medio=2, Alto=3, Crítico=4)

### 1.1 Registro Activo de Riesgos

| ID | Semana | Descripción | Responsable | Probabilidad | Impacto | Factor de Riesgo | Estado | Plan de Prevención | Plan de Contingencia |
|----|--------|-------------|-------------|:------------:|:-------:|:----------------:|--------|-------------------|---------------------|
| R01 | S04 | Operabilidad insuficiente: ICH inicial 70%, por debajo del umbral de 80% requerido para liberar el MVP | Arístides N. | Alta (3) | Alto (3) | 🟢 1 | **Cerrado** | Iterar sobre los 3 hallazgos de mayor severidad antes de S5. Re-evaluar heurísticamente el prototipo rediseñado. | Si ICH < 80% al cierre de S11, postergar lanzamiento y ejecutar sprint de UX con 5 correcciones prioritarias. |
| R02 | S04 | Disponibilidad en horarios pico: sin prueba de carga no se sabe si el sistema soporta 50+ usuarios simultáneos en bloque de tutorías | Shirel M. | Media (2) | Alto (3) | 🟡 6 | Activo | Ejecutar prueba de carga con JMeter en S11 simulando 50 usuarios concurrentes. | Si el sistema falla bajo carga, escalar a optimización de índices en PostgreSQL y revisar consultas N+1. |
| R03 | S04 | Confidencialidad de datos de menores: si la autenticación falla, datos de beneficiarios de bachillerato quedan expuestos | Ana Paola O. | Baja (1) | Crítico (4) | 🔴 4 | **Activo — materialización parcial** | Implementar JWT + HTTPS antes de S8. Activar auditoría de accesos desde el despliegue. Solo roles autorizados acceden a datos de menores. | Si se detecta vulnerabilidad en producción, desconectar inmediatamente el sistema y notificar al coordinador del programa. |
| R04 | S04 | Capacidad de aprendizaje insuficiente: usuarios nuevos no completan el primer registro de sesión sin ayuda | Itzel C. | Alta (3) | Medio (2) | 🟡 6 | **Activo — materializado en S05** | Diseñar flujo onboarding de 3 pasos. Validar en Cámara Gesell S5 que todos los participantes completen la tarea sin ayuda en ≤ 180 seg. | Si el tiempo promedio supera 300 seg., rediseñar el flujo de registro con menos pasos y agregar tooltips contextuales. |
| R05 | S04 | Modificabilidad limitada: agregar tutorías grupales requeriría reescribir el módulo de sesiones por acoplamiento alto | Ana Paola O. | Baja (1) | Medio (2) | 🟢 2 | Vigilancia | Refactorizar el módulo de sesiones a arquitectura modular antes de la entrega final. | Documentar el modelo de datos actual para facilitar una refactorización futura sin reescritura completa. El equipo decidió manejar sesiones con múltiples beneficiarios como registros independientes (un `Sesion` por tutor-beneficiario). |
| R06 | S11 | Backend no iniciado: las 3 tareas de infraestructura (SGT-14, SGT-15, SGT-16) están en TO DO a la semana 11, bloqueando la integración del frontend | Arístides N. | Alta (3) | Alto (3) | 🟢 1 | **Cerrado** | Priorizar desarrollo del backend durante las horas de clase de las semanas 11–12. Bloquear tiempo mínimo de 3 hrs/semana por integrante para backend. | Si el backend no está listo al cierre de S12, negociar reducción de alcance del piloto con el coordinador del programa. |
| R07 | S13 | Integridad del cómputo de horas acreditadas: la lógica de acreditación se introdujo en el backend después de que varias sesiones ya habían sido aprobadas, y la ruta `POST /sin-bitacora` nunca sumaba horas ni el `PUT` las descontaba al revertir un estado | Arístides N. | Alta (3) | Alto (3) | 🟢 1 | **Cerrado** | Introducir la lógica de acreditación en la misma transacción de aprobación y cubrirla con pruebas antes de que el revisor empiece a aprobar sesiones. | Si el contador queda desfasado, recalcular `horas_impartidas` desde cero sumando `duracion_hrs` de todas las bitácoras en estado `aprobado` del periodo activo. |
| R08 | S13 | Desfase de fechas por zona horaria UTC/CST: las fechas almacenadas en UTC en PostgreSQL se mostraban con un día de diferencia en el frontend para usuarios en México (CST = UTC−6) | Ana Paola O. | Alta (3) | Medio (2) | 🟢 1 | **Cerrado** | Normalizar todo el manejo de fechas en el frontend con una función `getLocalDate()` que parse `YYYY-MM-DD` sin conversión de zona horaria. | Si el desfase afecta lógica de negocio (sesiones que no aparecen como pendientes), corregir el parseo de fechas en todos los hooks y componentes afectados. |
| R09 | S12 | Restricciones de longitud insuficientes en campos de BD: campos definidos como `VarChar(N)` con N demasiado pequeño causan error Prisma P2000 (`LengthMismatch`) al guardar valores válidos del mundo real (p. ej. URLs de YouTube) | Arístides N. | Media (2) | Alto (3) | 🟢 1 | **Cerrado** | Revisar longitudes de todos los campos de texto antes del primer despliegue y definirlas con margen amplio (300+ para URLs, 500+ para texto libre). | Al detectar un P2000, ampliar el campo en el schema con `prisma db push` sin pérdida de datos y actualizar el valor guardado. |
| R10 | S13 | Drift entre schema de Prisma y migraciones formales: el equipo usó `prisma db push` para aplicar cambios de schema (renombre de enum, nuevos campos) en lugar de `prisma migrate dev`, dejando 15 commits de cambios al schema pero solo 3 migraciones formales | Arístides N. | Media (2) | Medio (2) | 🟡 4 | **Activo** | Documentar en CLAUDE.md que `prisma db push` es la estrategia deliberada para este proyecto y que `migrate dev` no es viable sin reset. | Si se necesita replicar la BD en un ambiente nuevo, ejecutar `prisma db push` directamente desde el schema actual en lugar de correr las migraciones, y documentar este proceso en el README. |

### 1.2 Historial de Actualizaciones

| Fecha | Semana | ID Riesgo | Cambio registrado | Quién actualizó |
|-------|--------|-----------|------------------|-----------------|
| 20/04/2026 | S11 | R06 | Riesgo nuevo identificado: backend sin iniciar | Arístides N. |
| 15/05/2026 | S11 | R01, R02 | Riesgos confirmados activos al cierre S11; sin cambio en factor | Shirel M. |
| 26/05/2026 | S14 | R06 | Riesgo cerrado. Backend funcional desde el 25 de abril (commit `0f46f7a`). Todas las rutas principales implementadas y en operación. | Arístides N. |
| 26/05/2026 | S14 | R01 | Múltiples mejoras de UI/UX aplicadas entre S10–S14: nueva UI de autenticación (AuthLayout + branding TALK!, 23-may), rediseño de dashboards del revisor, beneficiario y tutor (25–26 may). D-01 resuelto con componente `Button` estándar. Proyecto prácticamente terminado: riesgo cerrado. | Arístides N. |
| 26/05/2026 | S14 | R03 | JWT implementado desde el 25-abr (middleware `auth.js`). Se identificaron rutas sin protección: `POST/PUT/DELETE /api/usuarios`. HTTPS no configurado. | Arístides N. |
| 26/05/2026 | S14 | R04 | Riesgo materializado en S05: T1 promedió 221.5 seg (límite: 180 seg). Mejoras de UI aplicadas en S10–S14 sin re-medición formal. Onboarding y tooltips no implementados. | Arístides N. |
| 27/05/2026 | S14 | R07 | Riesgo nuevo (retroactivo S13) y cerrado. La lógica de acreditación de horas se introdujo después de varias aprobaciones, causando que `horas_impartidas` mostrara 1.5 hrs en lugar de 4.5. Tres bugs identificados: (1) horas no acumuladas en aprobaciones previas a la lógica, (2) `sin-bitacora` no acreditaba horas, (3) `PUT` no descontaba horas al revertir estado. Todos corregidos: commit `40ab521` + corrección directa de BD. | Arístides N. |
| 27/05/2026 | S14 | R08 | Riesgo nuevo (retroactivo S13) y cerrado. Fechas UTC de PostgreSQL se mostraban con 1 día de desfase en México (CST = UTC−6). Corregido con función `getLocalDate()` en commit `ae90980` (21-may) y `0e91859` (15-may). | Arístides N. |
| 27/05/2026 | S14 | R09 | Riesgo nuevo (retroactivo S12) y cerrado. Campo `link_video VarChar(40)` causó error P2000 al guardar URLs de YouTube. Corregido a `VarChar(300)` en commit `48cc258` (7-may). | Arístides N. |
| 27/05/2026 | S14 | R10 | Riesgo nuevo identificado. 15 commits de cambios al schema de Prisma pero solo 3 migraciones formales. El equipo usa `prisma db push` deliberadamente (migrate dev requeriría reset). Riesgo activo para ambientes nuevos. | Arístides N. |

### 1.3 Resumen de Exposición al Riesgo

| Factor | Crítico 🔴 (≥8) | Medio 🟡 (4–7) | Bajo 🟢 (≤3) |
|--------|:--------------:|:-------------:|:-----------:|
| Cantidad de riesgos | 1 | 3 | 6 |
| IDs | R03 | R02, R04, R10 | R01, R05, R06, R07, R08, R09 |

---

## 2. Casos de Pruebas Funcionales

> **Criterio de aprobación:** ≥ 80% de los casos deben estar en estado `✅ Pasa`.  
> **Severidad de defectos:** Crítico = bloquea el flujo principal · Mayor = funcionalidad degradada · Menor = problema cosmético o de usabilidad.  
> **Actualización:** El responsable QA ejecuta y actualiza el estado al cierre de cada sprint.

### 2.1 Módulo de Autenticación

#### 2.1.1 Login

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-AUTH-01 | Mostrar correctamente la vista de inicio de sesión | Usuario no autenticado, navegación a la pantalla de login | Abrir login y verificar título, campos email/contraseña, botón Iniciar sesión y enlace Regístrate | Todos los elementos de UI se muestran visibles | ✅ Pasa |
| CP-AUTH-02 | Manejo de error de autenticación | Intercept de login configurado con respuesta 401 | Escribir credenciales inválidas y enviar el formulario | Aparece mensaje de credenciales incorrectas | ✅ Pasa |
| CP-AUTH-03 | Login exitoso y navegación por rol tutor | Intercept de login configurado con respuesta 200 y rol tutor | Escribir credenciales de tutor y enviar el formulario | Se guarda sesión y la URL redirige a tutor dashboard | ✅ Pasa |
| CP-AUTH-04 | Validaciones obligatorias en login | Pantalla de login abierta | Enviar formulario sin capturar datos | Se muestra mensaje de campo obligatorio | ✅ Pasa |
| CP-AUTH-05 | Validación de formato email en cliente | Pantalla de login abierta | Capturar correo inválido y contraseña válida, luego enviar | Se muestra mensaje de correo inválido | ✅ Pasa |
| CP-AUTH-06 | Login exitoso y navegación por rol coordinador | Intercept de login configurado con respuesta 200 y rol coordinador | Capturar credenciales de coordinador y enviar el formulario | Se redirige a coordinador dashboard | ✅ Pasa |
| CP-AUTH-07 | Login exitoso y navegación por rol beneficiario | Intercept de login configurado con respuesta 200 y rol beneficiario | Capturar credenciales de beneficiario y enviar el formulario | Se redirige a beneficiario dashboard | ✅ Pasa |
| CP-AUTH-08 | Login exitoso y navegación por rol revisor | Intercept de login configurado con respuesta 200 y rol revisor | Capturar credenciales de revisor y enviar el formulario | Se redirige a revisor dashboard | ✅ Pasa |
| CP-AUTH-09 | No enviar request con login vacío | Intercept de login activo para observación | Dar click en Entrar sin capturar datos | Se muestran validaciones y no se dispara POST /auth/login | ✅ Pasa |
| CP-AUTH-10 | No enviar request con correo inválido | Intercept de login activo para observación | Capturar correo con formato inválido, contraseña y enviar | Se muestra error de correo inválido y no se dispara POST /auth/login | ✅ Pasa |
| CP-AUTH-11 | Persistir sesión en localStorage tras login exitoso | Intercept de login 200 con token y usuario tutor | Capturar credenciales válidas y enviar formulario | Se redirige a tutor dashboard y se guardan token y rol en localStorage | ✅ Pasa |
| CP-AUTH-12 | Cerrar sesión y bloquear acceso protegido con sesión limpia | Sesión simulada en localStorage | Ejecutar logout y luego navegar a /tutor/dashboard | localStorage queda vacío y la app redirige a /login | ✅ Pasa |
| CP-AUTH-13 | Redirigir a login al acceder ruta protegida sin sesión | Usuario no autenticado | Navegar directo a /tutor/dashboard | La app redirige automáticamente a /login | ✅ Pasa |
| CP-AUTH-14 | Redirección por rol desde raíz con sesión activa | Sesión activa con rol tutor en localStorage | Navegar a / | La app redirige a /tutor/dashboard según rol activo | ✅ Pasa |
| CP-AUTH-15 | Manejo de error de red en login | Intercept de login forzado con network error | Capturar credenciales válidas y enviar formulario | Se muestra mensaje genérico de error y no hay redirección a dashboard | ✅ Pasa |

#### 2.1.2 Register

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-AUTH-16 | Mostrar correctamente la vista de creación de cuenta | Usuario no autenticado, navegación a register | Abrir register y verificar campos nombre, email, rol, contraseña, confirmación y enlace a login | Todos los elementos esperados están visibles | ✅ Pasa |
| CP-AUTH-17 | Validación de coincidencia de contraseña | Pantalla de register abierta | Llenar nombre, email, rol y capturar contraseñas distintas | Se muestra mensaje de contraseñas no coinciden | ✅ Pasa |
| CP-AUTH-18 | Validaciones obligatorias en registro | Pantalla de register abierta | Enviar formulario sin datos | Se muestran mensajes de campos obligatorios | ✅ Pasa |
| CP-AUTH-19 | Navegación entre register y login | Pantalla de register abierta | Click en Inicia sesión | La URL cambia a login | ✅ Pasa |
| CP-AUTH-20 | Validación de longitud mínima de contraseña | Pantalla de register abierta | Llenar formulario con contraseña corta en ambos campos y enviar | Se muestra mensaje de mínimo 6 caracteres | ✅ Pasa |
| CP-AUTH-21 | Manejo de error de backend al registrar | Intercept de register configurado con 409 | Llenar formulario válido con correo existente y enviar | Se muestra mensaje de error al registrarse | ✅ Pasa |
| CP-AUTH-22 | Registro exitoso como beneficiario | Intercept de register configurado con token y usuario beneficiario | Llenar formulario de beneficiario con datos válidos y enviar | Se guarda la sesión y se redirige a beneficiario dashboard | ✅ Pasa |
| CP-AUTH-23 | Registro exitoso como revisor | Intercept de register configurado con token y usuario revisor | Llenar formulario de revisor con datos válidos y enviar | Se guarda la sesión y se redirige a revisor dashboard | ✅ Pasa |
| CP-AUTH-24 | Registro exitoso como coordinador | Intercept de register configurado con token y usuario coordinador | Llenar formulario de coordinador con datos válidos y enviar | Se guarda la sesión y se redirige a coordinador dashboard | ✅ Pasa |
| CP-AUTH-25 | No enviar request con contraseñas diferentes | Intercept de register activo para observación | Llenar formulario válido excepto confirmación distinta y enviar | No se dispara POST /auth/register | ✅ Pasa |
| CP-AUTH-26 | No enviar request con formulario vacío | Intercept de register activo para observación | Enviar formulario sin capturar datos | Se muestran validaciones y no se dispara POST /auth/register | ✅ Pasa |
| CP-AUTH-27 | Validar payload de beneficiario y persistencia de sesión | Intercept de register inspecciona body para rol beneficiario | Llenar formulario de beneficiario, enviar y validar localStorage | El payload contiene campos esperados, no incluye confirmPassword y se guarda sesión | ✅ Pasa |
| CP-AUTH-28 | Validar payload de revisor y persistencia de sesión | Intercept de register inspecciona body para rol revisor | Llenar formulario de revisor, enviar y validar localStorage | El payload contiene matrícula, carrera, semestre numérico, no incluye confirmPassword y se guarda sesión | ✅ Pasa |
| CP-AUTH-29 | Validar payload de coordinador y persistencia de sesión | Intercept de register inspecciona body para rol coordinador | Llenar formulario de coordinador, enviar y validar localStorage | El payload contiene departamento, no incluye confirmPassword y se guarda sesión | ✅ Pasa |
| CP-AUTH-30 | Persistir token, rol y usuario tras registro exitoso | Intercept de register 201 con token y usuario | Completar registro válido y enviar formulario | Se redirige a dashboard y quedan guardados token, rol y user en localStorage | ✅ Pasa |

#### 2.1.3 Registro Tutor

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-AUTH-31 | Renderizar correctamente la vista de registro de tutor | Usuario no autenticado, navegación a /register/tutor | Abrir la pantalla y validar nombre, correo, matrícula, carrera, semestre, contraseñas y botón | Todos los elementos del formulario están visibles | ✅ Pasa |
| CP-AUTH-32 | Navegar a login desde registro de tutor | Pantalla de registro de tutor abierta | Click en Inicia sesión | La URL redirige a /login | ✅ Pasa |
| CP-AUTH-33 | Mostrar validaciones de requeridos en registro tutor | Formulario de registro tutor abierto | Enviar formulario sin capturar datos | Se muestran mensajes obligatorios por campo | ✅ Pasa |
| CP-AUTH-34 | Validar formato de correo en registro tutor | Formulario con intercept POST /auth/register | Capturar correo inválido, completar resto de campos y enviar | Se muestra mensaje Correo inválido y no se dispara POST /auth/register | ✅ Pasa |
| CP-AUTH-35 | Validar coincidencia de contraseñas en registro tutor | Formulario con intercept POST /auth/register | Capturar confirmación distinta a password y enviar | Se muestra mensaje Las contraseñas no coinciden y no se dispara POST /auth/register | ✅ Pasa |
| CP-AUTH-36 | Validar longitud mínima de contraseña en registro tutor | Formulario con intercept POST /auth/register | Capturar contraseña corta y enviar | Se muestra mensaje Mínimo 6 caracteres y no se dispara POST /auth/register | ✅ Pasa |
| CP-AUTH-37 | Validar semestre inválido en registro tutor | Formulario con intercept POST /auth/register | Capturar semestre 0 y enviar | Se muestra mensaje Mínimo 1 y no se dispara POST /auth/register | ✅ Pasa |
| CP-AUTH-38 | Validar matrícula obligatoria en registro tutor | Formulario con intercept POST /auth/register | Limpiar matrícula y enviar | Se muestra mensaje de matrícula obligatoria y no se dispara POST /auth/register | ✅ Pasa |
| CP-AUTH-39 | Registrar tutor exitosamente | Intercepts de GET /api y POST /auth/register configurados con 200/201 | Completar formulario válido y enviar | Se guarda sesión y redirige a /tutor/dashboard | ✅ Pasa |
| CP-AUTH-40 | Persistir sesión tras registro y recarga | Intercepts de registro exitoso configurados | Completar registro válido, enviar y recargar página | token y rol permanecen en localStorage tras reload | ✅ Pasa |
| CP-AUTH-41 | Manejar correo duplicado en registro tutor | Intercept POST /auth/register configurado con 409 | Completar formulario con correo existente y enviar | Se muestra mensaje El email ya está registrado y no hay redirección a dashboard | ✅ Pasa |
| CP-AUTH-42 | Validar payload de tutor | Intercept POST /auth/register inspecciona body | Completar formulario de tutor válido y enviar | Payload incluye rol tutor, matrícula, carrera, semestre numérico y password | ✅ Pasa |
| CP-AUTH-43 | Validar payload limpio en registro tutor | Intercept POST /auth/register inspecciona body | Completar formulario de tutor válido y enviar | Payload no incluye confirmPassword ni campos de otros roles | ✅ Pasa |
| CP-AUTH-44 | Verificar ausencia de llamadas indebidas con formulario inválido | Intercept POST /auth/register activo | Provocar error de validación (contraseñas distintas) y enviar | No se dispara POST /auth/register | ✅ Pasa |
| CP-AUTH-45 | Persistir token, rol y user en localStorage | Intercepts de registro exitoso configurados | Completar registro válido y enviar | Se guardan token, rol y user en localStorage con valores esperados | ✅ Pasa |

#### 2.1.4 Postulación

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-AUTH-46 | Renderizar correctamente la vista de postulación | Usuario no autenticado, navegación a /postulacion | Abrir la pantalla y validar campos, textareas, input de archivo, link de video y botón de envío | Todos los elementos esperados del formulario están presentes | ✅ Pasa |
| CP-AUTH-47 | Navegar a login desde postulación | Pantalla de postulación abierta | Click en Inicia sesión | La URL redirige a /login | ✅ Pasa |
| CP-AUTH-48 | Mostrar validaciones de requeridos y bloquear envío vacío | Pantalla de postulación abierta con intercept POST /postulaciones | Enviar formulario sin capturar datos | Se muestran mensajes de obligatorio y no se dispara POST /postulaciones | ✅ Pasa |
| CP-AUTH-49 | Validar formato de correo en postulación | Formulario de postulación con intercept POST /postulaciones | Capturar correo inválido, completar resto de campos y enviar | Se muestra mensaje Correo inválido y no se dispara POST /postulaciones | ✅ Pasa |
| CP-AUTH-50 | Validar semestre mínimo | Formulario de postulación con intercept POST /postulaciones | Capturar semestre 0 y enviar | Se muestra mensaje Mín. 1 y no se dispara POST /postulaciones | ✅ Pasa |
| CP-AUTH-51 | Validar semestre máximo | Formulario de postulación con intercept POST /postulaciones | Capturar semestre 13 y enviar | Se muestra mensaje Máx. 12 y no se dispara POST /postulaciones | ✅ Pasa |
| CP-AUTH-52 | Validar longitud mínima en preguntas abiertas | Formulario de postulación con intercept POST /postulaciones | Capturar respuestas cortas (< 30 caracteres) y enviar | Se muestra mensaje Mínimo 30 caracteres y no se dispara POST /postulaciones | ✅ Pasa |
| CP-AUTH-53 | Validar link de video de YouTube | Formulario de postulación con intercept POST /postulaciones | Capturar URL no YouTube y enviar | Se muestra mensaje de link inválido y no se dispara POST /postulaciones | ✅ Pasa |
| CP-AUTH-54 | Permitir envío exitoso sin link de video opcional | Intercept POST /postulaciones configurado con 201 | Completar formulario válido sin link_video y enviar | Se registra postulación y se muestra pantalla de éxito | ✅ Pasa |
| CP-AUTH-55 | Mostrar y eliminar preview de imagen | Pantalla de postulación abierta | Seleccionar archivo de imagen y luego click en Quitar imagen | Aparece preview y posteriormente desaparece al quitar imagen | ✅ Pasa |
| CP-AUTH-56 | Cambiar a estado de confirmación tras envío exitoso | Intercept POST /postulaciones configurado con 201 | Completar formulario válido y enviar | Se muestra mensaje ¡Postulación enviada! y desaparece el botón de envío | ✅ Pasa |
| CP-AUTH-57 | Bloquear reenvío durante estado loading | Intercept POST /postulaciones configurado con delay | Enviar formulario válido y observar botón | El botón Enviar postulación queda deshabilitado durante la petición | ✅ Pasa |
| CP-AUTH-58 | Manejar error 409 en postulación | Intercept POST /postulaciones configurado con 409 | Enviar formulario válido | Se muestra mensaje de error y el formulario permanece disponible | ✅ Pasa |
| CP-AUTH-59 | Manejar error 500 en postulación | Intercept POST /postulaciones configurado con 500 | Enviar formulario válido | Se muestra mensaje de error, no aparece pantalla de éxito y el formulario queda disponible | ✅ Pasa |
| CP-AUTH-60 | Evitar reenvío manual tras primer submit | Intercept POST /postulaciones con delay | Enviar formulario válido y validar estado del botón | El botón queda deshabilitado tras el primer click y solo se procesa una petición | ✅ Pasa |
| CP-AUTH-61 | Validar payload multipart con campos requeridos | Intercept POST /postulaciones inspecciona body | Completar formulario válido y enviar | El payload incluye nombre_completo, email, matricula, carrera, semestre, por_que_escogerte y por_que_interesa | ✅ Pasa |
| CP-AUTH-62 | Validar campos opcionales y ausencia de endpoints indebidos | Intercepts de POST /postulaciones y endpoints auth/revisión activos | Enviar formulario con link_video y captura_duolingo | Payload incluye opcionales esperados, excluye campos indebidos y no se llaman endpoints ajenos | ✅ Pasa |

### 2.2 Módulo Tutor

### 2.2.1 Bitacora

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-BIT-01 | Enviar formulario llenando todos los campos | Tutor autenticado y formulario de bitácora abierto | Llenar actividades, logros, dificultades y plan siguiente; luego enviar | La bitácora se registra correctamente | ✅ Pasa |
| CP-BIT-02 | No permitir envío sin campos obligatorios | Formulario de bitácora abierto | Intentar enviar el formulario vacío | Se evidencian validaciones de requerido y no se completa el registro | ✅ Pasa |
| CP-BIT-03 | Registrar bitácora sin archivo de evidencia | Formulario de bitácora abierto | Llenar los campos de texto sin adjuntar archivo y enviar | La bitácora se registra correctamente | ✅ Pasa |
| CP-BIT-04 | Permitir registrar múltiples bitácoras | Tutor autenticado con acceso al formulario | Llenar una bitácora válida y enviarla nuevamente con otro contenido | Se permite el registro en ambos intentos | ✅ Pasa |

### 2.2.2 Sesiones

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-SES-01 | Mostrar sesiones con su tema y estado | Tutor autenticado y endpoint de sesiones con datos mock | Abrir la vista de sesiones | Se visualizan las sesiones con tema y estado | ✅ Pasa |
| CP-SES-02 | Mostrar badge de bitácora aprobada | Una sesión con bitácora aprobada en la lista | Abrir la vista de sesiones | Se muestra el badge Aprobada | ✅ Pasa |
| CP-SES-03 | Mostrar acción Ver bitácora o Registrar bitácora según corresponda | Una sesión con bitácora y otra sin bitácora | Abrir la vista de sesiones | Aparece Ver bitácora para la sesión con bitácora y Registrar bitácora para la sesión sin bitácora | ✅ Pasa |
| CP-SES-04 | Mostrar estado vacío cuando no hay sesiones | Endpoint de sesiones responde lista vacía | Abrir la vista de sesiones | Se muestra el mensaje Sin sesiones | ✅ Pasa |
| CP-SES-05 | Mostrar acción principal en el estado vacío | Endpoint de sesiones responde lista vacía | Abrir la vista de sesiones | Se muestra el botón Nueva sesión | ✅ Pasa |
| CP-SES-06 | Redirigir al login sin autenticación | Sin token en localStorage | Intentar acceder a /tutor/sesiones | La aplicación redirige a /login | ✅ Pasa |

### 2.3 Módulo de Revisión - Revisor

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-REV-01 | Cargar detalle de bitácora con sus datos asociados | Revisor autenticado y endpoints de bitácora, comentarios e incidencias disponibles | Abrir el detalle de la bitácora 1 | Se muestran actividades, logros, estado, tutor, beneficiario, comentarios e incidencias | ✅ Pasa |
| CP-REV-02 | Aprobar bitácora y añadir comentario exitosamente | Detalle de bitácora cargado y endpoint de comentarios disponible | Seleccionar estado aprobado, escribir comentario y aprobar la bitácora | Se publica el comentario, se aprueba la bitácora y se acredita horas | ✅ Pasa |
| CP-REV-03 | Mostrar validación de comentario vacío | Detalle de bitácora cargado | Intentar publicar un comentario sin texto | Se muestra mensaje de validación indicando que el comentario no puede estar vacío | ✅ Pasa |
| CP-REV-04 | Mostrar error si falla la actualización del estado | Intercept de actualización de bitácora con error 500 | Cambiar el estado de revisión y esperar la respuesta fallida | Se muestra un mensaje de error al actualizar el estado | ✅ Pasa |

### 2.4 Módulo de Rol - Beneficiario

#### 2.4.1 Tablero

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-BENEF-01 | Renderizar header con saludo dinámico y frase motivacional | Sesión activa de beneficiario y endpoint de sesiones disponible | Abrir el tablero y verificar saludo con nombre y frase motivacional | Se muestra saludo dinámico (Buenos días/tardes/noches), nombre del usuario y frase motivacional en naranja | ✅ Pasa |
| CP-BENEF-02 | Mostrar las 4 stat cards con sus valores | Sesión activa de beneficiario y endpoint de sesiones disponible | Abrir el tablero y verificar las tarjetas de estadísticas | Se muestran las cards: Sesiones Realizadas, Sesiones Programadas, Sesiones Canceladas y Total de Sesiones | ✅ Pasa |
| CP-BENEF-03 | Mostrar mensaje cuando no hay próxima sesión programada | Endpoint de sesiones responde lista vacía | Abrir el tablero sin sesiones registradas | Se muestra el mensaje "No tienes sesiones programadas próximamente" | ✅ Pasa |
| CP-BENEF-04 | Mostrar próxima sesión con tema y tutor | Endpoint de sesiones con sesión programada futura | Abrir el tablero y verificar widget de próxima sesión | Se muestran el tema y el nombre del tutor de la próxima sesión | ✅ Pasa |
| CP-BENEF-05 | Ocultar link de sesión si el beneficiario no ha confirmado asistencia | Próxima sesión con confirma_benef en false | Abrir el tablero y verificar el widget de próxima sesión | No se muestra el enlace de Zoom y aparece mensaje de aviso | ✅ Pasa |
| CP-BENEF-06 | Mostrar link de sesión después de confirmar asistencia | Próxima sesión con confirma_benef en true | Abrir el tablero con asistencia confirmada | Se muestra el enlace "Unirse a la sesión ahora" | ✅ Pasa |
| CP-BENEF-07 | Confirmar asistencia llama al endpoint correcto | Próxima sesión con confirma_benef en false y endpoint de asistencias disponible | Click en botón Confirmar Asistencia | Se ejecuta POST /api/asistencias/:id/confirmar y aparece toast de éxito | ✅ Pasa |
| CP-BENEF-08 | Botón cancelar asistencia aparece después de confirmar | Próxima sesión con confirma_benef en true | Abrir el tablero con asistencia ya confirmada | Se muestran el badge "Asistencia Confirmada" y el botón Cancelar | ✅ Pasa |
| CP-BENEF-09 | Mostrar calendario de sesiones con mes actual | Sesión activa y endpoint de sesiones disponible | Abrir el tablero y verificar el widget de calendario | Se muestra el calendario con el nombre del mes actual | ✅ Pasa |
| CP-BENEF-10 | Mostrar historial reciente de sesiones | Endpoint de sesiones con sesiones realizadas | Abrir el tablero y verificar la sección Historial Reciente | Se muestran los temas de las sesiones del historial | ✅ Pasa |
| CP-BENEF-11 | Redirigir a login sin autenticación | Usuario no autenticado | Intentar acceder a /beneficiario/dashboard sin token | La app redirige a /login | ✅ Pasa |

#### 2.4.2 Mis Sesiones

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-BENEF-12 | Mostrar historial completo de sesiones | Sesión activa y endpoint de sesiones con datos | Abrir Mis Sesiones y verificar lista | Se muestran todas las sesiones del beneficiario con tema, fecha y tutor | ✅ Pasa |
| CP-BENEF-13 | Mostrar badges de estado correctamente | Endpoint con sesiones en distintos estados | Abrir Mis Sesiones y revisar badges | Se muestran badges de realizada, programada y cancelada con colores correctos | ✅ Pasa |
| CP-BENEF-14 | Filtro Programadas muestra solo sesiones programadas | Lista con sesiones de distintos estados | Click en filtro Programadas | Solo se muestran sesiones con estado programada; las demás desaparecen | ✅ Pasa |
| CP-BENEF-15 | Filtro Realizadas muestra solo sesiones realizadas | Lista con sesiones de distintos estados | Click en filtro Realizadas | Solo se muestran sesiones con estado realizada; las demás desaparecen | ✅ Pasa |
| CP-BENEF-16 | Filtro Canceladas muestra solo sesiones canceladas | Lista con sesiones de distintos estados | Click en filtro Canceladas | Solo se muestran sesiones con estado cancelada; las demás desaparecen | ✅ Pasa |
| CP-BENEF-17 | Filtro Todas restablece el listado completo | Filtro previo aplicado | Click en filtro Programadas y luego en Todas | Se muestran nuevamente todas las sesiones sin importar su estado | ✅ Pasa |
| CP-BENEF-18 | Mostrar empty state cuando no hay sesiones | Endpoint de sesiones responde lista vacía | Abrir Mis Sesiones sin sesiones registradas | Se muestra el mensaje "Sin sesiones" | ✅ Pasa |
| CP-BENEF-19 | Mostrar empty state al filtrar por estado sin resultados | Lista sin sesiones del estado filtrado | Aplicar filtro de estado sin coincidencias | Se muestra el mensaje "Sin sesiones" para ese filtro | ✅ Pasa |
| CP-BENEF-20 | No mostrar botón de confirmar asistencia en el historial | Sesión activa y endpoint de sesiones disponible | Abrir Mis Sesiones y revisar todas las sesiones | No aparece ningún botón de "Confirmar asistencia" en la lista | ✅ Pasa |
| CP-BENEF-21 | Redirigir a login sin autenticación | Usuario no autenticado | Intentar acceder a /beneficiario/sesiones sin token | La app redirige a /login | ✅ Pasa |

### 2.5 Módulo de Rol - Coordinador

#### 2.5.1 Tablero

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-COORD-01 | Restringir acceso al tablero sin sesión | Usuario no autenticado | Navegar a /coordinador/dashboard | La app redirige a /login | ⬜ Pendiente |
| CP-COORD-02 | Permitir acceso al tablero con rol coordinador | Sesión activa de coordinador | Navegar a /coordinador/dashboard | Se renderiza el tablero de coordinador | ⬜ Pendiente |
| CP-COORD-03 | Mostrar estado de carga inicial | Sesión activa de coordinador y requests pendientes | Abrir tablero con latencia simulada | Se muestra spinner mientras cargan los datos | ⬜ Pendiente |
| CP-COORD-04 | Consumir endpoints requeridos del tablero | Intercepts activos para /usuarios, /sesiones y /bitacoras | Abrir tablero | Se ejecutan las 3 llamadas GET esperadas | ⬜ Pendiente |
| CP-COORD-05 | Enviar token en requests del tablero | Sesión activa con token en localStorage | Abrir tablero con intercept de headers | Cada request incluye Authorization Bearer | ⬜ Pendiente |
| CP-COORD-06 | Bloquear llamadas indebidas desde tablero | Intercepts activos para auth/register/postulaciones | Abrir tablero | No se disparan endpoints no relacionados | ⬜ Pendiente |
| CP-COORD-07 | Calcular tarjeta Tutores Activos | Endpoint /usuarios con mezcla de roles | Abrir tablero | La métrica coincide con cantidad de rol tutor | ⬜ Pendiente |
| CP-COORD-08 | Calcular tarjeta Beneficiarios | Endpoint /usuarios con mezcla de roles | Abrir tablero | La métrica coincide con cantidad de rol beneficiario | ⬜ Pendiente |
| CP-COORD-09 | Calcular tarjeta Sesiones del mes | Endpoint /sesiones con fechas de distintos meses | Abrir tablero | La métrica cuenta solo sesiones del mes actual | ⬜ Pendiente |
| CP-COORD-10 | Calcular tarjeta Bitácoras pendientes | Endpoint /bitacoras con estados mixtos | Abrir tablero | La métrica cuenta solo bitácoras en estado pendiente | ⬜ Pendiente |
| CP-COORD-11 | Renderizar gráfica de sesiones por mes | Endpoint /sesiones con datos históricos | Abrir tablero | Se muestran barras para los últimos 6 meses | ⬜ Pendiente |
| CP-COORD-12 | Renderizar donut de estado de bitácoras | Endpoint /bitacoras con pendientes/aprobadas/rechazadas | Abrir tablero | El donut y leyenda muestran distribución correcta | ⬜ Pendiente |
| CP-COORD-13 | Mostrar estado vacío de bitácoras cuando total es 0 | Endpoint /bitacoras responde vacío | Abrir tablero | Se muestra mensaje Sin bitácoras registradas | ⬜ Pendiente |
| CP-COORD-14 | Mostrar actividad reciente ordenada y limitada | Endpoint /sesiones con múltiples registros | Abrir tablero | Se listan máximo 5 sesiones ordenadas por fecha descendente | ⬜ Pendiente |
| CP-COORD-15 | Tolerar fallas parciales de endpoints | Falla de uno de los endpoints y otros exitosos | Abrir tablero | El tablero se renderiza con datos parciales sin crash | ⬜ Pendiente |
| CP-COORD-16 | Manejar 401 global en tablero | Endpoint protegido responde 401 | Abrir tablero con sesión expirada | Se limpia localStorage y redirige a /login | ⬜ Pendiente |

#### 2.5.2 Postulaciones

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-COORD-POST-01 | Restringir acceso a postulaciones sin sesión | Usuario no autenticado | Navegar a /coordinador/postulaciones | La app redirige a /login | ✅ Pasa |
| CP-COORD-POST-02 | Permitir acceso a postulaciones con rol coordinador | Sesión activa de coordinador | Navegar a /coordinador/postulaciones | Se renderiza la pantalla de postulaciones | ✅ Pasa |
| CP-COORD-POST-03 | Mostrar carga inicial de postulaciones | Sesión activa y request GET en progreso | Abrir pantalla con latencia simulada | Se muestra estado de loading en la tabla | ✅ Pasa |
| CP-COORD-POST-04 | Consumir endpoint base de listado | Intercept GET /postulaciones activo | Abrir pantalla | Se dispara GET /postulaciones una vez | ✅ Pasa |
| CP-COORD-POST-05 | Enviar token en request de listado | Sesión activa con token | Abrir pantalla con validación de headers | Request incluye Authorization Bearer | ✅ Pasa |
| CP-COORD-POST-06 | Renderizar columnas principales de tabla | GET /postulaciones responde datos válidos | Abrir pantalla y revisar encabezados/filas | Se muestran nombre, correo, matrícula, carrera, semestre, fecha y estado | ✅ Pasa |
| CP-COORD-POST-07 | Mostrar badge correcto por estado de postulación | GET /postulaciones con estados pendiente/aceptado/rechazado | Abrir pantalla | Cada registro muestra su badge y etiqueta correcta | ✅ Pasa |
| CP-COORD-POST-08 | Mostrar estado vacío sin postulaciones | GET /postulaciones responde arreglo vacío | Abrir pantalla | Se muestra mensaje No hay postulaciones para este periodo | ✅ Pasa |
| CP-COORD-POST-09 | Filtrar por estado pendiente | Intercepts GET con params activos | Click en filtro Pendiente | Se consulta con estado=pendiente y lista filtrada | ✅ Pasa |
| CP-COORD-POST-10 | Filtrar por estado aceptado | Intercepts GET con params activos | Click en filtro Aceptado | Se consulta con estado=aceptado y lista filtrada | ✅ Pasa |
| CP-COORD-POST-11 | Filtrar por estado rechazado | Intercepts GET con params activos | Click en filtro Rechazado | Se consulta con estado=rechazado y lista filtrada | ✅ Pasa |
| CP-COORD-POST-12 | Quitar filtro al seleccionar Todos | Filtro previo aplicado | Click en filtro Todos | Se consulta sin parámetro de estado y se restablece listado | ✅ Pasa |
| CP-COORD-POST-13 | Abrir modal de detalle desde acción ver | GET /postulaciones con al menos un registro | Click en ícono de ojo | Se abre modal con datos completos de la postulación | ✅ Pasa |
| CP-COORD-POST-14 | Cerrar modal sin acciones | Modal abierto | Click en Cerrar o cerrar modal | El modal se cierra sin cambios de estado | ✅ Pasa |
| CP-COORD-POST-15 | Mostrar acciones de pendiente en modal | Modal de registro en estado pendiente | Abrir detalle de pendiente | Se muestran botones Rechazar y Aceptar | ✅ Pasa |
| CP-COORD-POST-16 | Mostrar acción de aceptado/rechazado según estado | Modal de registro no pendiente | Abrir detalle de aceptado o rechazado | Se muestra solo acción permitida por estado | ✅ Pasa |
| CP-COORD-POST-17 | Aceptar postulación exitosamente | PATCH /postulaciones/:id/aceptar responde 200 | Abrir modal pendiente y aceptar | Se muestra toast de éxito, cierra modal y recarga listado | ✅ Pasa |
| CP-COORD-POST-18 | Rechazar postulación exitosamente | PATCH /postulaciones/:id/rechazar responde 200 | Abrir modal pendiente y rechazar | Se muestra toast de éxito, cierra modal y recarga listado | ✅ Pasa |
| CP-COORD-POST-19 | Manejar error al aceptar/rechazar | PATCH responde 4xx/5xx | Ejecutar acción de cambio de estado | Se muestra toast de error y se mantiene contexto del usuario | ✅ Pasa |
| CP-COORD-POST-20 | Bloquear llamadas indebidas desde módulo | Intercepts para endpoints no relacionados activos | Abrir pantalla y ejecutar acciones básicas | No se disparan auth/login, auth/register ni endpoints ajenos | ✅ Pasa |

#### 2.5.3 Usuarios

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-COORD-USR-01 | Restringir acceso a usuarios sin sesión | Usuario no autenticado | Navegar a /coordinador/usuarios | La app redirige a /login | ⬜ Pendiente |
| CP-COORD-USR-02 | Permitir acceso a usuarios con rol coordinador | Sesión activa de coordinador | Navegar a /coordinador/usuarios | Se renderiza la pantalla de usuarios | ⬜ Pendiente |
| CP-COORD-USR-03 | Consumir endpoint base de listado de usuarios | Intercept GET /usuarios activo | Abrir pantalla | Se dispara GET /usuarios al menos una vez | ⬜ Pendiente |
| CP-COORD-USR-04 | Enviar token en request de listado de usuarios | Sesión activa con token | Abrir pantalla con validación de headers | Request incluye Authorization Bearer | ⬜ Pendiente |
| CP-COORD-USR-05 | Renderizar tabla con columnas y datos principales | GET /usuarios responde datos válidos | Abrir pantalla y revisar encabezados/filas | Se muestran nombre, correo y rol de cada usuario | ⬜ Pendiente |
| CP-COORD-USR-06 | Mostrar badges correctos por rol | GET /usuarios con roles mixtos | Abrir pantalla | Cada fila muestra badge correcto para tutor/beneficiario/revisor/coordinador | ⬜ Pendiente |
| CP-COORD-USR-07 | Filtrar usuarios por nombre | Lista con múltiples usuarios | Escribir texto en buscador por nombre | Solo se muestran usuarios que coinciden con la búsqueda | ⬜ Pendiente |
| CP-COORD-USR-08 | Filtrar usuarios por rol | Lista con roles mixtos y filtro activo | Seleccionar rol en filtro | La tabla muestra solo usuarios del rol seleccionado | ⬜ Pendiente |
| CP-COORD-USR-09 | Mostrar estado vacío cuando no hay usuarios | GET /usuarios responde arreglo vacío | Abrir pantalla | Se muestra mensaje No hay usuarios registrados | ⬜ Pendiente |

#### 2.5.4 Periodos

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-COORD-PER-01 | Restringir acceso a periodos sin sesión | Usuario no autenticado | Navegar a /coordinador/periodos | La app redirige a /login | ⬜ Pendiente |
| CP-COORD-PER-02 | Permitir acceso a periodos con rol coordinador | Sesión activa de coordinador | Navegar a /coordinador/periodos | Se renderiza la pantalla de periodos | ⬜ Pendiente |
| CP-COORD-PER-03 | Mostrar carga inicial de periodos | Sesión activa y request GET en progreso | Abrir pantalla con latencia simulada | Se muestra estado de loading en tabla/listado | ⬜ Pendiente |
| CP-COORD-PER-04 | Consumir endpoint base de listado de periodos | Intercept GET /periodos activo | Abrir pantalla | Se dispara GET /periodos al menos una vez | ⬜ Pendiente |
| CP-COORD-PER-05 | Enviar token en requests de periodos | Sesión activa con token | Abrir pantalla con validación de headers | Request incluye Authorization Bearer | ⬜ Pendiente |
| CP-COORD-PER-06 | Renderizar tabla con datos principales de periodos | GET /periodos responde datos válidos | Abrir pantalla y revisar filas | Se muestran nombre, fechas y estado de cada periodo | ⬜ Pendiente |
| CP-COORD-PER-07 | Mostrar badge correcto por estado de periodo | GET /periodos con periodos activos/inactivos | Abrir pantalla | Cada fila muestra badge y etiqueta correcta de estado | ⬜ Pendiente |
| CP-COORD-PER-08 | Abrir modal de creación de periodo | Pantalla de periodos cargada | Click en Nuevo periodo | Se abre modal con formulario de creación | ⬜ Pendiente |
| CP-COORD-PER-09 | Validar campos obligatorios al crear periodo | Modal de creación abierto | Enviar formulario vacío | Se muestran mensajes de validación obligatoria | ⬜ Pendiente |
| CP-COORD-PER-10 | Crear periodo exitosamente | POST /periodos responde 201 | Completar formulario y guardar | Se muestra feedback de éxito y se actualiza listado | ⬜ Pendiente |
| CP-COORD-PER-11 | Manejar error de duplicidad al crear periodo | POST /periodos responde 409 | Enviar formulario con datos duplicados | Se muestra mensaje de conflicto sin cerrar contexto | ⬜ Pendiente |
| CP-COORD-PER-12 | Abrir modal de edición con datos precargados | Lista con al menos un periodo existente | Click en editar periodo | Modal abre con datos actuales del periodo seleccionado | ⬜ Pendiente |
| CP-COORD-PER-13 | Actualizar periodo exitosamente | PATCH /periodos/:id responde 200 | Editar datos y guardar cambios | Se muestra feedback de éxito y listado actualizado | ⬜ Pendiente |
| CP-COORD-PER-14 | Manejar error en creación/edición de periodo | POST/PATCH responde 4xx/5xx | Intentar guardar cambios | Se muestra mensaje de error y se conserva el formulario | ⬜ Pendiente |
| CP-COORD-PER-15 | Mostrar estado vacío cuando no hay periodos | GET /periodos responde arreglo vacío | Abrir pantalla | Se muestra mensaje No hay periodos registrados | ⬜ Pendiente |
| CP-COORD-PER-16 | Bloquear llamadas indebidas desde módulo periodos | Intercepts para endpoints no relacionados activos | Abrir pantalla y ejecutar acciones básicas | No se disparan endpoints ajenos al módulo | ⬜ Pendiente |

#### 2.5.5 Asignaciones

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-COORD-ASG-01 | Restringir acceso a asignaciones sin sesión | Usuario no autenticado | Navegar a /coordinador/asignaciones | La app redirige a /login | ⬜ Pendiente |
| CP-COORD-ASG-02 | Permitir acceso a asignaciones con rol coordinador | Sesión activa de coordinador | Navegar a /coordinador/asignaciones | Se renderiza la pantalla de asignaciones | ⬜ Pendiente |
| CP-COORD-ASG-03 | Mostrar carga inicial de asignaciones | Sesión activa y requests GET en progreso | Abrir pantalla con latencia simulada | Se muestra estado de loading en el módulo | ⬜ Pendiente |
| CP-COORD-ASG-04 | Consumir endpoints requeridos del módulo | Intercepts activos para /asignaciones, /tutores y /beneficiarios | Abrir pantalla | Se disparan llamadas GET requeridas al cargar | ⬜ Pendiente |
| CP-COORD-ASG-05 | Enviar token en requests de asignaciones | Sesión activa con token | Abrir pantalla con validación de headers | Requests incluyen Authorization Bearer | ⬜ Pendiente |
| CP-COORD-ASG-06 | Renderizar tabla/listado de asignaciones existentes | GET /asignaciones responde datos válidos | Abrir pantalla y revisar filas | Se muestran tutor, beneficiario, periodo y estado por asignación | ⬜ Pendiente |
| CP-COORD-ASG-07 | Mostrar estado vacío cuando no hay asignaciones | GET /asignaciones responde arreglo vacío | Abrir pantalla | Se muestra mensaje No hay asignaciones registradas | ⬜ Pendiente |
| CP-COORD-ASG-08 | Abrir modal de nueva asignación | Pantalla de asignaciones cargada | Click en Nueva asignación | Se abre modal con formulario de creación | ⬜ Pendiente |
| CP-COORD-ASG-09 | Validar campos obligatorios en creación | Modal de creación abierto | Enviar formulario vacío | Se muestran mensajes de validación obligatoria | ⬜ Pendiente |
| CP-COORD-ASG-10 | Crear asignación exitosamente | POST /asignaciones responde 201 | Seleccionar tutor/beneficiario/periodo y guardar | Se muestra feedback de éxito y listado actualizado | ⬜ Pendiente |
| CP-COORD-ASG-11 | Manejar conflicto por asignación duplicada | POST /asignaciones responde 409 | Intentar crear combinación ya existente | Se muestra mensaje de conflicto sin cerrar contexto | ⬜ Pendiente |
| CP-COORD-ASG-12 | Abrir modal de edición con datos precargados | Existe al menos una asignación en tabla | Click en editar una asignación | Modal abre con datos actuales precargados | ⬜ Pendiente |
| CP-COORD-ASG-13 | Actualizar asignación exitosamente | PATCH /asignaciones/:id responde 200 | Modificar datos y guardar | Se muestra feedback de éxito y listado actualizado | ⬜ Pendiente |
| CP-COORD-ASG-14 | Manejar error al crear o editar asignación | POST/PATCH responde 4xx/5xx | Intentar guardar cambios | Se muestra mensaje de error y formulario permanece abierto | ⬜ Pendiente |
| CP-COORD-ASG-15 | Filtrar asignaciones por criterio visible | Lista con datos mixtos y filtro activo | Aplicar filtro de búsqueda/estado | Se muestran solo asignaciones que cumplen el criterio | ⬜ Pendiente |
| CP-COORD-ASG-16 | Bloquear llamadas indebidas desde módulo asignaciones | Intercepts de endpoints no relacionados activos | Abrir módulo y ejecutar acciones básicas | No se disparan endpoints ajenos al módulo | ⬜ Pendiente |

#### 2.5.6 Horas Acreditadas

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-COORD-HRS-01 | Restringir acceso a horas acreditadas sin sesión | Usuario no autenticado | Navegar a /coordinador/horas | La app redirige a /login | ⬜ Pendiente |
| CP-COORD-HRS-02 | Permitir acceso a horas acreditadas con rol coordinador | Sesión activa de coordinador | Navegar a /coordinador/horas | Se renderiza la pantalla de horas acreditadas | ⬜ Pendiente |
| CP-COORD-HRS-03 | Mostrar carga inicial del módulo de horas | Sesión activa y request GET en progreso | Abrir pantalla con latencia simulada | Se muestra estado de loading en tabla/listado | ⬜ Pendiente |
| CP-COORD-HRS-04 | Consumir endpoint base de horas acreditadas | Intercept GET de horas activo | Abrir pantalla | Se dispara GET de horas acreditadas al menos una vez | ⬜ Pendiente |
| CP-COORD-HRS-05 | Enviar token en requests del módulo | Sesión activa con token | Abrir pantalla con validación de headers | Request incluye Authorization Bearer | ⬜ Pendiente |
| CP-COORD-HRS-06 | Renderizar tabla con datos de horas por beneficiario | GET responde datos válidos | Abrir pantalla y revisar filas | Se muestran beneficiario, tutor, horas acumuladas y periodo | ⬜ Pendiente |
| CP-COORD-HRS-07 | Mostrar badge/estado de cumplimiento de horas | GET con registros en estado completo/en progreso | Abrir pantalla | Cada registro muestra estado correcto según horas acumuladas | ⬜ Pendiente |
| CP-COORD-HRS-08 | Filtrar horas por búsqueda de beneficiario | Lista con múltiples beneficiarios | Escribir criterio en buscador | Solo se muestran registros coincidentes | ⬜ Pendiente |
| CP-COORD-HRS-09 | Filtrar horas por periodo | Lista con más de un periodo | Seleccionar periodo en filtro | Se muestran solo registros del periodo seleccionado | ⬜ Pendiente |
| CP-COORD-HRS-10 | Abrir detalle de acreditación de horas | Existe al menos un registro en listado | Click en ver detalle | Se abre vista/modal con desglose de horas | ⬜ Pendiente |
| CP-COORD-HRS-11 | Acreditar horas exitosamente | POST/PATCH de acreditación responde 200/201 | Capturar horas válidas y guardar | Se muestra feedback de éxito y listado actualizado | ⬜ Pendiente |
| CP-COORD-HRS-12 | Validar límites de horas en formulario | Formulario de acreditación abierto | Ingresar horas inválidas (vacío/negativas/excedidas) | Se muestran mensajes de validación y no se envía request | ⬜ Pendiente |
| CP-COORD-HRS-13 | Manejar conflicto o reglas de negocio en acreditación | Endpoint responde 409/422 | Intentar acreditar fuera de regla | Se muestra mensaje de conflicto y se conserva contexto | ⬜ Pendiente |
| CP-COORD-HRS-14 | Manejar error del servidor al acreditar horas | Endpoint responde 500 | Enviar acreditación | Se muestra mensaje de error y no se rompe la pantalla | ⬜ Pendiente |
| CP-COORD-HRS-15 | Mostrar estado vacío cuando no hay registros | GET responde arreglo vacío | Abrir pantalla | Se muestra mensaje No hay horas acreditadas registradas | ⬜ Pendiente |
| CP-COORD-HRS-16 | Bloquear llamadas indebidas desde módulo de horas | Intercepts de endpoints no relacionados activos | Abrir módulo y ejecutar acciones básicas | No se disparan endpoints ajenos al módulo | ⬜ Pendiente |

#### 2.5.7 Progreso Beneficiario

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-COORD-PRG-01 | Restringir acceso a progreso sin sesión | Usuario no autenticado | Navegar a /coordinador/progreso | La app redirige a /login | ⬜ Pendiente |
| CP-COORD-PRG-02 | Permitir acceso a progreso con rol coordinador | Sesión activa de coordinador | Navegar a /coordinador/progreso | Se renderiza la pantalla de progreso beneficiario | ⬜ Pendiente |
| CP-COORD-PRG-03 | Mostrar carga inicial de progreso | Sesión activa y requests GET en progreso | Abrir pantalla con latencia simulada | Se muestra estado de loading en el módulo | ⬜ Pendiente |
| CP-COORD-PRG-04 | Consumir endpoints requeridos de progreso | Intercepts activos para endpoints de progreso/sesiones/horas | Abrir pantalla | Se disparan llamadas GET requeridas al cargar | ⬜ Pendiente |
| CP-COORD-PRG-05 | Enviar token en requests del módulo de progreso | Sesión activa con token | Abrir pantalla con validación de headers | Requests incluyen Authorization Bearer | ⬜ Pendiente |
| CP-COORD-PRG-06 | Renderizar listado de beneficiarios con métricas | GET responde datos válidos | Abrir pantalla y revisar filas | Se muestran beneficiario, tutor asignado, horas acumuladas y avance | ⬜ Pendiente |
| CP-COORD-PRG-07 | Mostrar barra o indicador de progreso correcto | Datos con porcentajes diferentes | Abrir pantalla | Cada beneficiario muestra porcentaje/estado acorde a sus horas | ⬜ Pendiente |
| CP-COORD-PRG-08 | Filtrar progreso por búsqueda de beneficiario | Lista con múltiples beneficiarios | Escribir criterio en buscador | Se muestran solo beneficiarios coincidentes | ⬜ Pendiente |
| CP-COORD-PRG-09 | Filtrar progreso por periodo | Lista con más de un periodo | Seleccionar periodo en filtro | Se muestran solo registros del periodo seleccionado | ⬜ Pendiente |
| CP-COORD-PRG-10 | Abrir detalle de progreso de un beneficiario | Existe al menos un registro en listado | Click en ver detalle | Se abre vista/modal con desglose de sesiones y horas | ⬜ Pendiente |
| CP-COORD-PRG-11 | Mostrar alertas para beneficiarios en riesgo | Datos con beneficiarios bajo umbral | Abrir pantalla | Se muestran badges o alertas de riesgo académico/avance | ⬜ Pendiente |
| CP-COORD-PRG-12 | Ordenar listado por porcentaje de avance | Lista con porcentajes variados | Aplicar orden ascendente/descendente | El orden del listado respeta el criterio seleccionado | ⬜ Pendiente |
| CP-COORD-PRG-13 | Mostrar estado vacío cuando no hay progreso disponible | GET responde arreglo vacío | Abrir pantalla | Se muestra mensaje No hay datos de progreso disponibles | ⬜ Pendiente |
| CP-COORD-PRG-14 | Manejar error de carga del módulo de progreso | Endpoint principal responde 4xx/5xx | Abrir pantalla | Se muestra mensaje de error y la app no crashea | ⬜ Pendiente |
| CP-COORD-PRG-15 | Mantener contexto al fallar un endpoint secundario | Un endpoint falla y otros responden | Abrir pantalla | Se renderiza información parcial con feedback controlado | ⬜ Pendiente |
| CP-COORD-PRG-16 | Bloquear llamadas indebidas desde módulo progreso | Intercepts de endpoints no relacionados activos | Abrir módulo y ejecutar acciones básicas | No se disparan endpoints ajenos al módulo | ⬜ Pendiente |

### 2.6 Módulo de integración entre roles

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|

### 2.7 Resumen de Cobertura de Pruebas

| Módulo | Total casos | Estado |
|--------|:-----------:|--------|
| Autenticación | 62 | Documentado |
| Bitácora - Tutor | 4 | Documentado |
| Sesiones - Tutor | 6 | Documentado |
| Revisión - Revisor | 4 | Documentado |
| Beneficiario | 21 | Documentado |
| Coordinador | 109 | Documentado |
| Módulo integración entre roles | 0 | NO Documentado |
| **TOTAL** | **206** | **Documentado** |

---

## 3. Evaluación Heurística — Nielsen

> **Fórmula ICH:** `ICH = (heurísticas sin violación ÷ 10) × 100`  
> **Meta:** ICH ≥ 80% antes de liberar el MVP.  
> **Severidad:** 1 = cosmético · 2 = menor · 3 = mayor · 4 = catastrófico · 5 = bloqueante.  
> **Evaluador/a UX:** Ana Paola Oviedo Salgado.

### 3.1 Escala de Severidad

| Nivel | Descripción | Tiempo de resolución |
|:-----:|-------------|---------------------|
| 1 | Problema cosmético — solo si hay tiempo disponible | Siguiente sprint |
| 2 | Problema menor — baja prioridad de corrección | Dentro del sprint actual |
| 3 | Problema mayor — alta prioridad, corregir antes del MVP | < 72 horas |
| 4 | Catastrófico — bloquea una tarea del usuario | < 24 horas |
| 5 | Bloqueante — impide el uso del sistema | Inmediato |

### 3.2 Evaluación por Heurística — Semana 5 (Línea Base)

> Flujo evaluado: registro de sesión y confirmación de asistencia (flujo crítico).

| # | Heurística | Descripción | ¿Cumple? | Severidad | Hallazgo | Evidencia |
|---|-----------|-------------|:--------:|:---------:|----------|-----------|
| H1 | Visibilidad del estado del sistema | El sistema debe mantener al usuario informado sobre lo que ocurre mediante retroalimentación oportuna | ✅ | — | El spinner de carga es visible en todas las pantallas con datos asíncronos | — |
| H2 | Coincidencia con el mundo real | El sistema usa términos y conceptos familiares para el usuario, no jerga técnica | ✅ | — | Terminología del programa Talk! usada correctamente (sesión, tutor, beneficiario) | — |
| H3 | Control y libertad del usuario | El usuario puede deshacer o salir de acciones no deseadas sin consecuencias | ⚠️ | 2 | D-02: No existe confirmación al salir del formulario de bitácora con datos sin guardar | Captura-H3.png |
| H4 | Consistencia y estándares | Los elementos de interfaz son consistentes en todo el sistema | ❌ | 3 | D-01: El botón "Confirmar asistencia" tiene un estilo diferente al resto de los botones primarios del sistema | Captura-H4.png |
| H5 | Prevención de errores | El diseño evita que ocurran errores antes de que el usuario los cometa | ✅ | — | Validación de formularios presente en todos los módulos con mensajes de error claros | — |
| H6 | Reconocimiento antes que recuerdo | El usuario no tiene que memorizar información entre pasos; opciones visibles | ⚠️ | 2 | D-03: En "Asignaciones", el tutor seleccionado no se muestra visible hasta hacer scroll | Captura-H6.png |
| H7 | Flexibilidad y eficiencia de uso | El sistema permite atajos para usuarios expertos sin dificultar el uso para novatos | ✅ | — | N/A para el perfil de usuario actual | — |
| H8 | Diseño estético y minimalista | Las pantallas no contienen información irrelevante o rara vez necesaria | ✅ | — | Diseño limpio; no hay elementos visuales innecesarios | — |
| H9 | Ayuda a reconocer y recuperarse de errores | Los mensajes de error identifican el problema y sugieren solución en lenguaje claro | ✅ | — | Mensajes de error en rojo con descripción del problema en todos los formularios | — |
| H10 | Ayuda y documentación | El sistema provee ayuda fácil de buscar orientada a la tarea del usuario | ❌ | 3 | D-04: No existe ningún texto de ayuda, tooltip ni documentación de usuario en el sistema | — |

### 3.3 Evaluación por Heurística — Semana 14 (Re-evaluación Final)

> Flujo evaluado: flujos completos del MVP por rol (beneficiario, tutor, revisor, coordinador).  
> Mejoras aplicadas entre S05 y S14: rediseño de dashboards, sistema de diseño TALK! con componente `Button` estándar, mejoras visuales en vista beneficiario (stat cards, calendario, gráfica de sesiones, frase motivacional), consistencia de estilos en toda la plataforma, textos de apoyo y mensajes contextuales en flujos críticos.

| # | Heurística | Descripción | ¿Cumple? | Severidad | Observación |
|---|-----------|-------------|:--------:|:---------:|-------------|
| H1 | Visibilidad del estado del sistema | El sistema mantiene al usuario informado con retroalimentación oportuna | ✅ | — | Spinners, toasts y badges de estado presentes en todos los módulos |
| H2 | Coincidencia con el mundo real | El sistema usa lenguaje familiar para el usuario | ✅ | — | Terminología consistente con el programa Talk! en toda la plataforma |
| H3 | Control y libertad del usuario | El usuario puede salir de acciones no deseadas sin consecuencias | ✅ | — | D-02 resuelto: se agregó manejo de cancelación en formularios críticos |
| H4 | Consistencia y estándares | Los elementos de interfaz son consistentes en todo el sistema | ✅ | — | D-01 resuelto: componente `Button` estándar aplicado en toda la plataforma (commit `a02ae5b`) |
| H5 | Prevención de errores | El diseño evita errores antes de que el usuario los cometa | ✅ | — | Validaciones en todos los formularios con mensajes claros y específicos |
| H6 | Reconocimiento antes que recuerdo | Opciones visibles sin necesidad de memorizar | ✅ | — | D-03 resuelto: navegación y elementos clave visibles sin necesidad de scroll |
| H7 | Flexibilidad y eficiencia de uso | El sistema permite uso eficiente para usuarios con experiencia variada | ✅ | — | Flujos simplificados y acciones principales accesibles en una sola pantalla |
| H8 | Diseño estético y minimalista | Las pantallas no contienen información irrelevante | ✅ | — | Dashboards rediseñados con información relevante y jerarquía visual clara |
| H9 | Ayuda a reconocer y recuperarse de errores | Los mensajes de error identifican el problema y sugieren solución | ✅ | — | Mensajes de error descriptivos en todos los formularios y llamadas a la API |
| H10 | Ayuda y documentación | El sistema provee ayuda contextual orientada a la tarea | ✅ | — | D-04 resuelto: textos de apoyo y mensajes contextuales agregados en flujos críticos |

### 3.4 Resumen ICH

| Evaluación | Fecha | Flujo evaluado | Heurísticas OK | ICH | ¿Cumple meta? |
|-----------|-------|---------------|:--------------:|:---:|:-------------:|
| Línea base (S05) | Sem. 5, 2026 | Registro sesión + confirmación asistencia | 7 / 10 | **70%** | ❌ No (meta: ≥ 80%) |
| Re-evaluación final (S14) | 28 may 2026 | Flujos completos del MVP por rol | 10 / 10 | **100%** | ✅ Sí |

### 3.5 Registro de Hallazgos

| ID | Heurística | Descripción del hallazgo | Severidad | Estado | Responsable corrección | Fecha resolución |
|----|-----------|--------------------------|:---------:|--------|----------------------|-----------------|
| D-01 | H4 | Botón "Confirmar asistencia" con estilo inconsistente respecto al sistema de diseño | 3 | ✅ Resuelto | Ana Paola O. | 23 may 2026 |
| D-02 | H3 | Sin confirmación al abandonar formulario de bitácora con cambios sin guardar | 2 | ✅ Resuelto | Ana Paola O. | 26 may 2026 |
| D-03 | H6 | Tutor asignado no visible en "Asignaciones" sin hacer scroll en pantallas pequeñas | 2 | ✅ Resuelto | Ana Paola O. | 26 may 2026 |
| D-04 | H10 | Ausencia total de ayuda contextual, tooltips y documentación de usuario | 3 | ✅ Resuelto | Ana Paola O. | 26 may 2026 |

> **Nota D-01:** El commit `a02ae5b` (23-may-2026) introdujo el componente `Button` estándar resolviendo la inconsistencia detectada en S05.  
> **Notas D-02, D-03, D-04:** Resueltos durante el rediseño y mejoras de UI/UX aplicadas en S13–S14.

### 3.6 Resumen de Severidades

| Severidad | S05 | S14 |
|:---------:|:---:|:---:|
| 5 — Bloqueante | 0 | 0 |
| 4 — Catastrófico | 0 | 0 |
| 3 — Mayor | 2 | 0 |
| 2 — Menor | 2 | 0 |
| 1 — Cosmético | 0 | 0 |
| **Total abiertos** | **4** | **0** |

> **Severidad promedio S05:** `(3+2+2+3) ÷ 4 = 2.5` · Meta: ≤ 2.5 ✅  
> **Severidad promedio S14:** `0` — todos los hallazgos resueltos ✅

---

## 4. Sesiones de Prueba con Usuarios

> Esta sección documenta todas las sesiones de evaluación con usuarios reales, ya sea presencial (Cámara Gesell) o remota. Se registran tiempos por tarea, perfil de participantes y observaciones clave.

### 4.1 Sesiones Realizadas / Planeadas

| # | Tipo | Fecha | Semana | Modalidad | Estado | Flujos evaluados |
|---|------|-------|--------|-----------|--------|-----------------|
| 1 | Cámara Gesell | Semana 5, 2026 | S05 | Presencial | ✅ Realizada | Registro de sesión, confirmación de asistencia |
| 2 | Prueba de usabilidad | _Semana 12, 2026_ | S12 | Presencial | ⬜ Planeada | Flujos completos del MVP |
| 3 | Prueba de aceptación (piloto) | _Semana 14, 2026_ | S14 | Remota | ⬜ Planeada | Sistema completo con usuarios reales del programa Talk! |

---

### 4.2 Sesión 1 — Cámara Gesell (Semana 5)

#### Información general

| Campo | Detalle |
|-------|---------|
| Fecha | Semana 5, 2026 |
| Moderador/a | Itzel Covarrubias Basurto |
| Observadores | Arístides Nieto G., Shirel Marino R., Ana Paola Oviedo S. |
| Herramienta | Prototipo funcional (Figma / Airtable) |
| Duración total | ~90 minutos |
| Objetivo | Validar que los flujos de registro de sesión y confirmación de asistencia se completan sin ayuda en ≤ 180 segundos |

#### Participantes

| ID | Perfil | Rol en el sistema | Experiencia tecnológica | Edad aprox. |
|----|--------|------------------|------------------------|:-----------:|
| P1 | TutorTEC — estudiante universitario | Tutor | Alta | 21 |
| P2 | TutorTEC — estudiante universitario | Tutor | Alta | 20 |
| P3 | Beneficiario — estudiante preparatoria | Beneficiario | Media | 16 |
| P4 | Beneficiario — estudiante secundaria | Beneficiario | Básica | 14 |
| P5 | Coordinador del programa | Coordinador | Media | 35 |

#### Tareas evaluadas

| # | Tarea | Descripción | Rol | Tiempo límite |
|---|-------|-------------|-----|:-------------:|
| T1 | Registro de sesión | Crear una nueva sesión de tutoría con fecha, hora, tema y link | Tutor | 180 seg |
| T2 | Confirmar asistencia | Confirmar la asistencia a una sesión realizada | Beneficiario | 60 seg |
| T3 | Ver progreso | Navegar a "Mi Progreso" y leer el avance | Beneficiario | 60 seg |
| T4 | Ver bitácoras pendientes | Identificar bitácoras sin revisar en el panel | Coordinador | 90 seg |

#### Registro de Tiempos (segundos)

| Participante | T1 — Registro sesión | T2 — Confirmar asistencia | T3 — Ver progreso | T4 — Ver bitácoras |
|:------------:|:--------------------:|:------------------------:|:-----------------:|:-----------------:|
| P1 (Tutor) | 245 ⚠️ | — | — | — |
| P2 (Tutor) | 198 ⚠️ | — | — | — |
| P3 (Beneficiario) | — | 42 ✅ | 35 ✅ | — |
| P4 (Beneficiario) | — | 58 ✅ | 67 ✅ | — |
| P5 (Coordinador) | — | — | — | 78 ✅ |
| **Promedio** | **221.5 ❌** | **50 ✅** | **51 ✅** | **78 ✅** |
| **Meta** | ≤ 180 seg | ≤ 60 seg | ≤ 60 seg | ≤ 90 seg |

> ⚠️ La tarea T1 superó el límite de 180 seg en ambos participantes. El promedio de 221.5 seg incumple la meta. Ver hallazgo D-01 (H4) como causa principal.

#### Observaciones cualitativas

| # | Participante | Observación | Heurística relacionada |
|---|:------------:|-------------|:---------------------:|
| OBS-01 | P1 | "¿Dónde está el botón para guardar?" — buscó el botón de crear sesión durante ~30 seg | H4, H6 |
| OBS-02 | P2 | Intentó hacer doble click en el botón al no ver retroalimentación inmediata | H1 |
| OBS-03 | P4 | "No entendí qué significa 'Confirmar asistencia'" — leyó la pantalla dos veces antes de hacer click | H2 |
| OBS-04 | P5 | Navegó directamente a "Bitácoras" sin problemas; comentó que el diseño es "limpio y fácil" | H8 ✅ |

#### Métricas de la sesión

| Métrica | Valor | Meta | ¿Cumple? |
|---------|:-----:|:----:|:--------:|
| ICH (heurísticas sin violación) | 70% | ≥ 80% | ❌ |
| Severidad promedio de hallazgos | 2.5 | ≤ 2.5 | ✅ |
| Tiempo prom. T1 (registro sesión) | 221.5 seg | ≤ 180 seg | ❌ |
| Tiempo prom. T2 (confirmar asistencia) | 50 seg | ≤ 60 seg | ✅ |
| Tasa de completitud de tareas (sin ayuda) | 80% | ≥ 80% | ✅ |

---

### 4.3 Sesión 2 — Prueba de Usabilidad MVP (Semana 12) ⬜ Planeada

#### Información general

| Campo | Detalle |
|-------|---------|
| Fecha tentativa | Semana 12, 2026 |
| Moderador/a | Itzel Covarrubias Basurto |
| Observadores | Todos los integrantes del equipo |
| Sistema a evaluar | MVP funcional con backend integrado |
| Objetivo | Verificar ICH ≥ 80%, tasa de éxito en flujos críticos y corregir fricciones cognitivas |

#### Participantes planeados

| # | Perfil | Cantidad |
|---|--------|:--------:|
| TutorTEC (estudiantes universitarios) | Tutor | 3 |
| Beneficiarios (preparatoria / secundaria) | Beneficiario | 2 |
| Coordinador del programa | Coordinador | 1 |
| **Total** | — | **6** |

#### Lista de verificación pre-sesión

- [ ] Sistema desplegado y accesible desde la red del salón
- [ ] Cuentas de prueba creadas para cada rol
- [ ] Tareas impresas en tarjetas para cada participante
- [ ] Cronómetro y hoja de registro listos
- [ ] Formulario de consentimiento informado firmado (especialmente para menores)
- [ ] Cámara o pantalla de observación lista (si aplica)
- [ ] Grabación de pantalla activada (con consentimiento)

#### Tareas a evaluar

| # | Tarea | Rol | Tiempo límite |
|---|-------|-----|:-------------:|
| T1 | Registro de sesión de tutoría | Tutor | ≤ 180 seg |
| T2 | Llenado de bitácora post-sesión | Tutor | ≤ 240 seg |
| T3 | Confirmar asistencia a sesión | Beneficiario | ≤ 60 seg |
| T4 | Ver progreso propio | Beneficiario | ≤ 60 seg |
| T5 | Ver bitácoras pendientes y agregar comentario | Coordinador/Revisor | ≤ 120 seg |
| T6 | Verificar horas acreditadas de un tutor | Coordinador | ≤ 90 seg |

#### Plantilla de registro de tiempos (llenar durante la sesión)

| Participante | Perfil | T1 | T2 | T3 | T4 | T5 | T6 |
|:------------:|--------|:--:|:--:|:--:|:--:|:--:|:--:|
| P1 | Tutor | | | — | — | — | — |
| P2 | Tutor | | | — | — | — | — |
| P3 | Tutor | | | — | — | — | — |
| P4 | Beneficiario | — | — | | | — | — |
| P5 | Beneficiario | — | — | | | — | — |
| P6 | Coordinador | — | — | — | — | | |
| **Promedio** | — | **[ ]** | **[ ]** | **[ ]** | **[ ]** | **[ ]** | **[ ]** |
| **Meta** | — | ≤ 180 | ≤ 240 | ≤ 60 | ≤ 60 | ≤ 120 | ≤ 90 |

---

## Apéndice — Convenciones

### Estados de casos de prueba

| Símbolo | Estado | Descripción |
|:-------:|--------|-------------|
| ✅ | Pasa | El resultado obtenido coincide con el resultado esperado |
| ❌ | Falla | El resultado no coincide; se registra un defecto en GitHub Issues |
| ⚠️ | Pasa con advertencia | Funciona pero hay un aspecto a mejorar |
| ⬜ | Pendiente | Aún no ejecutado |
| 🚫 | Bloqueado | No se puede ejecutar por dependencia pendiente |

### Probabilidad e Impacto de Riesgos

| Valor | Probabilidad | Impacto |
|:-----:|-------------|---------|
| 1 | Baja (< 20%) | Bajo — impacto mínimo en el proyecto |
| 2 | Media (20–50%) | Medio — retraso o degradación parcial |
| 3 | Alta (> 50%) | Alto — afecta hitos del proyecto |
| 4 | — | Crítico — compromete datos o el MVP completo |

### Factor de Riesgo

| Factor | Color | Prioridad |
|:------:|:-----:|-----------|
| ≥ 8 | 🔴 | Alta — acción inmediata requerida |
| 4–7 | 🟡 | Media — monitorear en cada sprint |
| ≤ 3 | 🟢 | Baja — vigilancia periódica |

---

*Documento mantenido en `/docs/calidad/plan_calidad.md` · Actualizar al cierre de cada sprint · Responsable: Shirel Marino Ramirez*