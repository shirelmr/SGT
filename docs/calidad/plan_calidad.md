# Plan de Calidad — SGT Talk!

> **Proyecto:** SGT — Sistema de Gestión Talk!  
> **Equipo:** AIAS · Shirel Marino Ramírez · Arístides Nieto Guzmán · Ana Paola Oviedo Salgado · Itzel Covarrubias Basurto  
> **Curso:** TC3004B Planeación de Sistemas de Software · Semestre Enero–Junio 2026  
> **Responsable QA:** Shirel Marino Ramirez
> **Última actualización:** 15 de mayo de 2026 · Semana 11

---

## Índice

1. [Gestión de Riesgos](#1-gestión-de-riesgos)
2. [Casos de Pruebas Funcionales](#2-casos-de-pruebas-funcionales)
3. [Evaluación Heurística — Nielsen](#3-evaluación-heurística--nielsen)
4. [Sesiones de Prueba con Usuarios](#4-sesiones-de-prueba-con-usuarios)

---

## 1. Gestión de Riesgos

> **Instrucciones de actualización:** Este registro se revisa al cierre de cada sprint. El Responsable QA actualiza el estado y el factor de riesgo. Si algún riesgo cambia de probabilidad o impacto, agrega una nueva fila con la fecha de actualización en lugar de sobrescribir la anterior.  
> **Factor de Riesgo** = Probabilidad × Impacto  (escala: Baja=1, Media=2, Alta=3 · Bajo=1, Medio=2, Alto=3, Crítico=4)

### 1.1 Registro Activo de Riesgos

| ID | Semana | Descripción | Responsable | Probabilidad | Impacto | Factor de Riesgo | Estado | Plan de Prevención | Plan de Contingencia |
|----|--------|-------------|-------------|:------------:|:-------:|:----------------:|--------|-------------------|---------------------|
| R01 | S04 | Operabilidad insuficiente: ICH actual 70%, por debajo del umbral de 80% requerido para liberar el MVP | Arístides N. | Alta (3) | Alto (3) | 🟡 9 | Activo | Iterar sobre los 3 hallazgos de mayor severidad antes de S5. Re-evaluar heurísticamente el prototipo rediseñado. | Si ICH < 80% al cierre de S11, postergar lanzamiento y ejecutar sprint de UX con 5 correcciones prioritarias. |
| R02 | S04 | Disponibilidad en horarios pico: sin prueba de carga no se sabe si el sistema soporta 50+ usuarios simultáneos en bloque de tutorías | Shirel M. | Media (2) | Alto (3) | 🟡 6 | Activo | Ejecutar prueba de carga con JMeter en S11 simulando 50 usuarios concurrentes. | Si el sistema falla bajo carga, escalar a optimización de índices en PostgreSQL y revisar consultas N+1. |
| R03 | S04 | Confidencialidad de datos de menores: si la autenticación falla, datos de beneficiarios de bachillerato quedan expuestos | Ana Paola O. | Baja (1) | Crítico (4) | 🔴 4 | Activo | Implementar JWT + HTTPS antes de S8. Activar auditoría de accesos desde el despliegue. Solo roles autorizados acceden a datos de menores. | Si se detecta vulnerabilidad en producción, desconectar inmediatamente el sistema y notificar al coordinador del programa. |
| R04 | S04 | Capacidad de aprendizaje insuficiente: usuarios nuevos no completan el primer registro de sesión sin ayuda | Itzel C. | Alta (3) | Medio (2) | 🟡 6 | Activo | Diseñar flujo onboarding de 3 pasos. Validar en Cámara Gesell S5 que todos los participantes completen la tarea sin ayuda en ≤ 180 seg. | Si el tiempo promedio supera 300 seg., rediseñar el flujo de registro con menos pasos y agregar tooltips contextuales. |
| R05 | S04 | Modificabilidad limitada: agregar tutorías grupales requeriría reescribir el módulo de sesiones por acoplamiento alto | Ana Paola O. | Baja (1) | Medio (2) | 🟢 2 | Vigilancia | Refactorizar el módulo de sesiones a arquitectura modular antes de la entrega final. | Documentar el modelo de datos actual para facilitar una refactorización futura sin reescritura completa. |
| R06 | S11 | Backend no iniciado: las 3 tareas de infraestructura (SGT-14, SGT-15, SGT-16) están en TO DO a la semana 11, bloqueando la integración del frontend | Arístides N. | Alta (3) | Alto (3) | 🔴 9 | **Nuevo** | Priorizar desarrollo del backend durante las horas de clase de las semanas 11–12. Bloquear tiempo mínimo de 3 hrs/semana por integrante para backend. | Si el backend no está listo al cierre de S12, negociar reducción de alcance del piloto con el coordinador del programa. |

### 1.2 Historial de Actualizaciones

| Fecha | Semana | ID Riesgo | Cambio registrado | Quién actualizó |
|-------|--------|-----------|------------------|-----------------|
| 20/04/2026 | S11 | R06 | Riesgo nuevo identificado: backend sin iniciar | Arístides N. |
| 15/05/2026 | S11 | R01, R02 | Riesgos confirmados activos al cierre S11; sin cambio en factor | Shirel M. |

### 1.3 Resumen de Exposición al Riesgo

| Factor | Crítico 🔴 (≥8) | Medio 🟡 (4–7) | Bajo 🟢 (≤3) |
|--------|:--------------:|:-------------:|:-----------:|
| Cantidad de riesgos | 2 | 3 | 1 |
| IDs | R03, R06 | R01, R02, R04 | R05 |

---

## 2. Casos de Pruebas Funcionales

> **Criterio de aprobación:** ≥ 80% de los casos deben estar en estado `✅ Pasa`.  
> **Severidad de defectos:** Crítico = bloquea el flujo principal · Mayor = funcionalidad degradada · Menor = problema cosmético o de usabilidad.  
> **Actualización:** El responsable QA ejecuta y actualiza el estado al cierre de cada sprint.

### 2.1 Módulo de Autenticación

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado | Defecto (si aplica) |
|----|--------------|--------------|-------|--------------------|--------|---------------------|
| CP-AUTH-01 | Login con credenciales válidas (rol Coordinador) | Usuario coordinador existe en BD | 1. Ir a `/login` · 2. Ingresar `coordinador@test.com` + contraseña · 3. Click "Iniciar sesión" | Redirección a `/coordinador/dashboard` con nombre de usuario en navbar | 🚫 Bloqueado | Vite (localhost:5173) no iniciado |
| CP-AUTH-02 | Login con credenciales válidas (rol Tutor) | Usuario tutor existe en BD | 1. Ir a `/login` · 2. Ingresar `tutor@test.com` + contraseña · 3. Click "Iniciar sesión" | Redirección a `/tutor/dashboard` | 🚫 Bloqueado | Vite (localhost:5173) no iniciado |
| CP-AUTH-03 | Login con credenciales válidas (rol Revisor) | Usuario revisor existe en BD | Igual que CP-AUTH-01 con email de revisor | Redirección a `/revisor/dashboard` | ⬜ Pendiente | — |
| CP-AUTH-04 | Login con credenciales válidas (rol Beneficiario) | Usuario beneficiario existe en BD | Igual que CP-AUTH-01 con email de beneficiario | Redirección a `/beneficiario/dashboard` | ⬜ Pendiente | — |
| CP-AUTH-05 | Login con contraseña incorrecta | Usuario existe en BD | 1. Ingresar email válido + contraseña incorrecta · 2. Click "Iniciar sesión" | Mensaje de error "Credenciales incorrectas" visible; no redirección | 🚫 Bloqueado | Vite (localhost:5173) no iniciado |
| CP-AUTH-06 | Acceso a ruta protegida sin sesión activa | Sin token en localStorage | 1. Navegar directamente a `/coordinador/dashboard` sin estar autenticado | Redirección a `/login` | 🚫 Bloqueado | Vite (localhost:5173) no iniciado |
| CP-AUTH-07 | Acceso a ruta de otro rol | Autenticado como Tutor | 1. Estando autenticado como Tutor, navegar a `/coordinador/dashboard` | Redirección a `/tutor/dashboard` (no acceso cruzado) | ⬜ Pendiente | — |
| CP-AUTH-08 | Cerrar sesión | Sesión activa | 1. Click en "Cerrar sesión" en sidebar o navbar | Redirección a `/login`; localStorage limpio | ⬜ Pendiente | — |

### 2.2 Módulo de Sesiones — Tutor

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado | Defecto |
|----|--------------|--------------|-------|--------------------|--------|---------|
| CP-SES-01 | Crear nueva sesión | Autenticado como Tutor; tiene beneficiario asignado | 1. Ir a "Mis Sesiones" · 2. Click "Nueva sesión" · 3. Llenar todos los campos · 4. Click "Crear sesión" | Sesión aparece en lista con estado "programada" | ⬜ Pendiente | — |
| CP-SES-02 | Crear sesión sin beneficiario asignado | Tutor sin beneficiario | 1. Ir a "Nueva sesión" | Lista de beneficiarios vacía; no se puede crear la sesión | ⬜ Pendiente | — |
| CP-SES-03 | Crear sesión con campos vacíos | Autenticado como Tutor | 1. Ir a "Nueva sesión" · 2. Dejar campos requeridos vacíos · 3. Click "Crear sesión" | Mensajes de validación en cada campo requerido; no se envía el formulario | ⬜ Pendiente | — |
| CP-SES-04 | Listar sesiones del tutor | Al menos 1 sesión creada | 1. Ir a "Mis Sesiones" | Se listan solo las sesiones del tutor autenticado, ordenadas por fecha descendente | 🚫 Bloqueado | Vite (localhost:5173) no iniciado |
| CP-SES-05 | Ver bitácora de una sesión | Sesión existente | 1. En lista de sesiones, click "Ver bitácora" | Se abre la vista de bitácora de esa sesión específica | ⬜ Pendiente | — |

### 2.3 Módulo de Bitácoras — Tutor

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado | Defecto |
|----|--------------|--------------|-------|--------------------|--------|---------|
| CP-BIT-01 | Registrar nueva bitácora | Sesión sin bitácora; autenticado como Tutor | 1. Ir a sesión sin bitácora · 2. Llenar todos los campos · 3. Click "Registrar bitácora" | Bitácora guardada; vista cambia a modo lectura | 🚫 Bloqueado | Frontend y backend caídos; test usa login real contra BD |
| CP-BIT-02 | Registrar bitácora con campos vacíos | Sesión sin bitácora | 1. Dejar campos requeridos vacíos · 2. Click "Registrar" | Mensajes de validación; no se guarda | 🚫 Bloqueado | Frontend y backend caídos; test usa login real contra BD |
| CP-BIT-03 | Editar bitácora existente | Bitácora ya registrada | 1. Click "Editar" · 2. Modificar campos · 3. Click "Guardar cambios" | Cambios persistidos; vista vuelve a modo lectura | ⬜ Pendiente | — |
| CP-BIT-04 | Ver comentarios del revisor | Bitácora con al menos 1 comentario | 1. Abrir bitácora | Comentarios visibles con nombre del revisor, estado y fecha | ⬜ Pendiente | — |

### 2.4 Módulo de Bitácoras — Revisor

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado | Defecto |
|----|--------------|--------------|-------|--------------------|--------|---------|
| CP-REV-01 | Listar bitácoras por periodo | Autenticado como Revisor; hay bitácoras | 1. Ir a "Bitácoras" · 2. Seleccionar periodo activo | Lista de bitácoras del periodo con estado y filtros visibles | ⬜ Pendiente | — |
| CP-REV-02 | Filtrar bitácoras por tutor | Bitácoras de múltiples tutores | 1. Seleccionar tutor en filtro | Solo se muestran bitácoras del tutor seleccionado | ⬜ Pendiente | — |
| CP-REV-03 | Filtrar bitácoras por estado | Bitácoras con distintos estados | 1. Seleccionar "Pendiente" en filtro de estado | Solo se muestran bitácoras pendientes | ⬜ Pendiente | — |
| CP-REV-04 | Agregar comentario a bitácora | Bitácora existente | 1. Abrir detalle de bitácora · 2. Escribir comentario · 3. Seleccionar estado · 4. Click "Enviar comentario" | Comentario aparece en la lista; estado de bitácora actualizado | 🚫 Bloqueado | Backend (localhost:3000) caído; cy.login() no puede autenticar |
| CP-REV-05 | Cambiar estado a "Aprobado" | Bitácora en estado "revisado" | 1. Agregar comentario con estado "Aprobado" | Bitácora aparece como aprobada en la lista | 🚫 Bloqueado | Backend (localhost:3000) caído; cy.login() no puede autenticar |

### 2.5 Módulo de Asistencias — Beneficiario

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado | Defecto |
|----|--------------|--------------|-------|--------------------|--------|---------|
| CP-ASIS-01 | Ver lista de sesiones | Autenticado como Beneficiario; tiene sesiones asignadas | 1. Ir a "Mis Sesiones" | Sesiones listadas ordenadas por fecha; se muestra estado y tutor | ⬜ Pendiente | — |
| CP-ASIS-02 | Confirmar asistencia a sesión realizada | Sesión con estado "realizada" y `confirma_benef = false` | 1. Ver sesión pasada · 2. Click "Confirmar asistencia" | Badge "Asistencia confirmada" visible; botón desaparece | ⬜ Pendiente | — |
| CP-ASIS-03 | No mostrar botón en sesiones programadas | Sesión con estado "programada" | 1. Ver sesión futura | No aparece botón de confirmar asistencia | ⬜ Pendiente | — |
| CP-ASIS-04 | No mostrar botón en sesión ya confirmada | Sesión con `confirma_benef = true` | 1. Ver sesión ya confirmada | Solo aparece badge de confirmación; sin botón | ⬜ Pendiente | — |

### 2.6 Dashboard — Coordinador

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado | Defecto |
|----|--------------|--------------|-------|--------------------|--------|---------|
| CP-COORD-01 | Ver estadísticas del dashboard | Autenticado como Coordinador; datos en BD | 1. Ir a `/coordinador/dashboard` | Tarjetas con: tutores activos, beneficiarios inscritos, sesiones del mes, bitácoras pendientes | ⬜ Pendiente | — |
| CP-COORD-02 | Crear nuevo usuario | Autenticado como Coordinador | 1. Ir a "Usuarios" · 2. Click "Nuevo usuario" · 3. Llenar formulario · 4. Click "Crear usuario" | Usuario aparece en tabla con rol correcto | 🚫 Bloqueado | Vite (localhost:5173) no iniciado |
| CP-COORD-03 | Editar usuario existente | Al menos 1 usuario en BD | 1. Click ícono editar en fila de usuario · 2. Modificar campos · 3. Guardar | Cambios reflejados en tabla | ⬜ Pendiente | — |
| CP-COORD-04 | Eliminar usuario | Al menos 1 usuario en BD | 1. Click ícono eliminar · 2. Confirmar en diálogo | Usuario desaparece de la tabla | ⬜ Pendiente | — |
| CP-COORD-05 | Crear periodo académico | Autenticado como Coordinador | 1. Ir a "Periodos" · 2. Click "Nuevo periodo" · 3. Llenar campos · 4. Guardar | Periodo aparece en tabla | ⬜ Pendiente | — |
| CP-COORD-06 | Activar periodo (desactiva el anterior) | Al menos 1 periodo activo | 1. Editar periodo inactivo · 2. Activar toggle "Periodo activo" · 3. Guardar | Nuevo periodo activo; anterior en inactivo. Warning visible en formulario | ⬜ Pendiente | — |
| CP-COORD-07 | Asignar tutor a beneficiario | Tutor y beneficiario en mismo periodo | 1. Ir a "Asignaciones" · 2. Seleccionar periodo · 3. Seleccionar tutor en dropdown del beneficiario | Asignación guardada; `id_tutor` actualizado | ⬜ Pendiente | — |
| CP-COORD-08 | Ver horas acreditadas por tutor | Sesiones realizadas con bitácora aprobada | 1. Ir a "Horas Acreditadas" · 2. Seleccionar periodo | Tabla con horas impartidas, % acreditado y horas acreditadas por tutor | ⬜ Pendiente | — |
| CP-COORD-09 | Registrar examen de inicio de beneficiario | Beneficiario sin examen | 1. Ir a "Progreso Beneficiarios" · 2. Click "Registrar examen" · 3. Ingresar % y fecha | Examen registrado; columna muestra valor en badge azul | ⬜ Pendiente | — |
| CP-COORD-10 | Registrar examen de término de beneficiario | Beneficiario con examen de inicio ya registrado | 1. Click "Registrar examen" · 2. Ingresar % de término | Examen registrado; barra de progreso visible | ⬜ Pendiente | — |

### 2.7 Módulo de Progreso — Beneficiario

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado | Defecto |
|----|--------------|--------------|-------|--------------------|--------|---------|
| CP-PROG-01 | Ver progreso con ambos exámenes | Ambos exámenes registrados | 1. Ir a "Mi Progreso" | Examen inicio, examen término y barra de avance general visible | ⬜ Pendiente | — |
| CP-PROG-02 | Ver progreso sin exámenes | Sin exámenes registrados | 1. Ir a "Mi Progreso" | Mensaje "Examen aún no aplicado" en ambas tarjetas | ⬜ Pendiente | — |
| CP-PROG-03 | Mensaje motivacional correcto | Avance calculado | 1. Ver avance ≤ 30% · 2. Ver avance entre 31–60% · 3. Ver avance > 60% | Mensajes: "¡Estás comenzando!" / "¡Buen progreso!" / "¡Excelente desempeño!" | ⬜ Pendiente | — |

### 2.8 Resumen de Cobertura de Pruebas

| Módulo | Total casos | ✅ Pasan | ❌ Fallan | 🚫 Bloqueados | ⬜ Pendientes | % Cobertura |
|--------|:-----------:|:--------:|:--------:|:------------:|:------------:|:-----------:|
| Autenticación | 8 | 0 | 0 | 4 | 4 | 0% |
| Sesiones (Tutor) | 5 | 0 | 0 | 1 | 4 | 0% |
| Bitácoras (Tutor) | 4 | 0 | 0 | 2 | 2 | 0% |
| Bitácoras (Revisor) | 5 | 0 | 0 | 2 | 3 | 0% |
| Asistencias (Beneficiario) | 4 | 0 | 0 | 0 | 4 | 0% |
| Dashboard (Coordinador) | 10 | 0 | 0 | 1 | 9 | 0% |
| Progreso (Beneficiario) | 3 | 0 | 0 | 0 | 3 | 0% |
| **TOTAL** | **39** | **0** | **0** | **10** | **29** | **0%** |

> 🚫 **Causa del bloqueo (S11):** Cypress no pudo conectar al baseUrl `http://localhost:5173` — servidor Vite no estaba corriendo al momento de la ejecución. Los tests de `bitacora.cy.js`, `bitacora_ia.cy.js`, `revisor.cy.js` y `revisor_ai.cy.js` tienen dependencia adicional del backend (localhost:3000), también caído.  
> 🎯 **Meta:** ≥ 80% de casos en estado ✅ Pasa antes del MVP (Semana 12).

---

## 3. Evaluación Heurística — Nielsen

> **Fórmula ICH:** `ICH = (heurísticas sin violación ÷ 10) × 100`  
> **Meta:** ICH ≥ 80% antes de liberar el MVP.  
> **Severidad:** 1 = cosmético · 2 = menor · 3 = mayor · 4 = catastrófico · 5 = bloqueante.  
> **Evaluador/a UX:** Itzel Covarrubias Basurto.

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

### 3.3 Resumen ICH

| Evaluación | Fecha | Flujo evaluado | Heurísticas OK | ICH | ¿Cumple meta? |
|-----------|-------|---------------|:--------------:|:---:|:-------------:|
| Línea base (S05) | Sem. 5, 2026 | Registro sesión + confirmación | 7 / 10 | **70%** | ❌ No (meta: ≥ 80%) |
| Re-evaluación (S11) | 15 may 2026 | Pendiente | — | — | ⬜ Pendiente |
| Re-evaluación (S12) | _pendiente_ | — | — | — | ⬜ Pendiente |

### 3.4 Registro de Hallazgos

| ID | Heurística | Descripción del hallazgo | Severidad | Estado | Responsable corrección | Fecha resolución |
|----|-----------|--------------------------|:---------:|--------|----------------------|-----------------|
| D-01 | H4 | Botón "Confirmar asistencia" con estilo inconsistente respecto al sistema de diseño | 3 | 🔴 Abierto | Ana Paola O. | — |
| D-02 | H3 | Sin confirmación al abandonar formulario de bitácora con cambios sin guardar | 2 | 🔴 Abierto | Ana Paola O. | — |
| D-03 | H6 | Tutor asignado no visible en "Asignaciones" sin hacer scroll en pantallas pequeñas | 2 | 🔴 Abierto | Ana Paola O. | — |
| D-04 | H10 | Ausencia total de ayuda contextual, tooltips y documentación de usuario | 3 | 🔴 Abierto | Itzel C. | — |

### 3.5 Resumen de Severidades

| Severidad | Cantidad | % del total |
|:---------:|:--------:|:-----------:|
| 5 — Bloqueante | 0 | 0% |
| 4 — Catastrófico | 0 | 0% |
| 3 — Mayor | 2 | 50% |
| 2 — Menor | 2 | 50% |
| 1 — Cosmético | 0 | 0% |
| **Total** | **4** | — |

> **Severidad promedio:** `(3+2+2+3) ÷ 4 = 2.5` · Meta: ≤ 2.5 ✅

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
| Objetivo | Verificar ICH ≥ 80% y tiempo promedio T1 ≤ 180 seg post-correcciones |

#### Participantes planeados

| # | Perfil | Cantidad |
|---|--------|:--------:|
| TutorTEC (estudiantes universitarios) | Tutor | 3 |
| Beneficiarios (preparatoria / secundaria) | Beneficiario | 3 |
| Coordinador del programa | Coordinador | 1 |
| **Total** | — | **7** |

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
| P6 | Beneficiario | — | — | | | — | — |
| P7 | Coordinador | — | — | — | — | | |
| **Promedio** | — | | | | | | |
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
