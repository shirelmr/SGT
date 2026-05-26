# Plan de Calidad — SGT Talk!

> **Proyecto:** SGT — Sistema de Gestión Talk!  
> **Equipo:** AIAS · Shirel Marino Ramírez · Arístides Nieto Guzmán · Ana Paola Oviedo Salgado · Itzel Covarrubias Basurto  
> **Curso:** TC3004B Planeación de Sistemas de Software · Semestre Enero–Junio 2026  
> **Responsable QA:** Shirel Marino Ramirez
> **Última actualización:** 25 de mayo de 2026 · Semana 11

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

#### 2.1.2 Register

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-AUTH-12 | Mostrar correctamente la vista de creación de cuenta | Usuario no autenticado, navegación a register | Abrir register y verificar campos nombre, email, rol, contraseña, confirmación y enlace a login | Todos los elementos esperados están visibles | ✅ Pasa |
| CP-AUTH-13 | Validación de coincidencia de contraseña | Pantalla de register abierta | Llenar nombre, email, rol y capturar contraseñas distintas | Se muestra mensaje de contraseñas no coinciden | ✅ Pasa |
| CP-AUTH-14 | Validaciones obligatorias en registro | Pantalla de register abierta | Enviar formulario sin datos | Se muestran mensajes de campos obligatorios | ✅ Pasa |
| CP-AUTH-15 | Navegación entre register y login | Pantalla de register abierta | Click en Inicia sesión | La URL cambia a login | ✅ Pasa |
| CP-AUTH-16 | Validación de longitud mínima de contraseña | Pantalla de register abierta | Llenar formulario con contraseña corta en ambos campos y enviar | Se muestra mensaje de mínimo 6 caracteres | ✅ Pasa |
| CP-AUTH-17 | Manejo de error de backend al registrar | Intercept de register configurado con 409 | Llenar formulario válido con correo existente y enviar | Se muestra mensaje de error al registrarse | ✅ Pasa |
| CP-AUTH-18 | Registro exitoso como beneficiario | Intercept de register configurado con token y usuario beneficiario | Llenar formulario de beneficiario con datos válidos y enviar | Se guarda la sesión y se redirige a beneficiario dashboard | ✅ Pasa |
| CP-AUTH-19 | Registro exitoso como revisor | Intercept de register configurado con token y usuario revisor | Llenar formulario de revisor con datos válidos y enviar | Se guarda la sesión y se redirige a revisor dashboard | ✅ Pasa |
| CP-AUTH-20 | Registro exitoso como coordinador | Intercept de register configurado con token y usuario coordinador | Llenar formulario de coordinador con datos válidos y enviar | Se guarda la sesión y se redirige a coordinador dashboard | ✅ Pasa |
| CP-AUTH-21 | No enviar request con contraseñas diferentes | Intercept de register activo para observación | Llenar formulario válido excepto confirmación distinta y enviar | No se dispara POST /auth/register | ✅ Pasa |
| CP-AUTH-22 | No enviar request con formulario vacío | Intercept de register activo para observación | Enviar formulario sin capturar datos | Se muestran validaciones y no se dispara POST /auth/register | ✅ Pasa |
| CP-AUTH-23 | Validar payload de beneficiario y persistencia de sesión | Intercept de register inspecciona body para rol beneficiario | Llenar formulario de beneficiario, enviar y validar localStorage | El payload contiene campos esperados, no incluye confirmPassword y se guarda sesión | ✅ Pasa |
| CP-AUTH-24 | Validar payload de revisor y persistencia de sesión | Intercept de register inspecciona body para rol revisor | Llenar formulario de revisor, enviar y validar localStorage | El payload contiene matrícula, carrera, semestre numérico, no incluye confirmPassword y se guarda sesión | ✅ Pasa |
| CP-AUTH-25 | Validar payload de coordinador y persistencia de sesión | Intercept de register inspecciona body para rol coordinador | Llenar formulario de coordinador, enviar y validar localStorage | El payload contiene departamento, no incluye confirmPassword y se guarda sesión | ✅ Pasa |
| CP-AUTH-26 | Persistir token, rol y usuario tras registro exitoso | Intercept de register 201 con token y usuario | Completar registro válido y enviar formulario | Se redirige a dashboard y quedan guardados token, rol y user en localStorage | ✅ Pasa |

### 2.1.3 Postulación

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|

### 2.1.3 Registro Tutor

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|

### 2.2 Módulo Tutor

### 2.2.1 Bitacora

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-BIT-01 | Enviar formulario llenando todos los campos | Tutor autenticado y formulario de bitácora abierto | Llenar actividades, logros, dificultades y plan siguiente; luego enviar | La bitácora se registra correctamente | ✅ Pasa |
| CP-BIT-02 | No permitir envío sin campos obligatorios | Formulario de bitácora abierto | Intentar enviar el formulario vacío | Se evidencian validaciones de requerido y no se completa el registro | ✅ Pasa |
| CP-BIT-03 | Registrar bitácora sin archivo de evidencia | Formulario de bitácora abierto | Llenar los campos de texto sin adjuntar archivo y enviar | La bitácora se registra correctamente | ✅ Pasa |
| CP-BIT-04 | Permitir registrar múltiples bitácoras | Tutor autenticado con acceso al formulario | Llenar una bitácora válida y enviarla nuevamente con otro contenido | Se permite el registro en ambos intentos | ✅ Pasa |

### 2.2.2 

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|

### 2.3 Módulo de Revisión - Revisor

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-REV-01 | Cargar detalle de bitácora con sus datos asociados | Revisor autenticado y endpoints de bitácora, comentarios e incidencias disponibles | Abrir el detalle de la bitácora 1 | Se muestran actividades, logros, estado, tutor, beneficiario, comentarios e incidencias | ✅ Pasa |
| CP-REV-02 | Aprobar bitácora y añadir comentario exitosamente | Detalle de bitácora cargado y endpoint de comentarios disponible | Seleccionar estado aprobado, escribir comentario y aprobar la bitácora | Se publica el comentario, se aprueba la bitácora y se acredita horas | ✅ Pasa |
| CP-REV-03 | Mostrar validación de comentario vacío | Detalle de bitácora cargado | Intentar publicar un comentario sin texto | Se muestra mensaje de validación indicando que el comentario no puede estar vacío | ✅ Pasa |
| CP-REV-04 | Mostrar error si falla la actualización del estado | Intercept de actualización de bitácora con error 500 | Cambiar el estado de revisión y esperar la respuesta fallida | Se muestra un mensaje de error al actualizar el estado | ✅ Pasa |

### 2.4 Módulo de Sesiones - Tutor

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-SES-01 | Mostrar sesiones con su tema y estado | Tutor autenticado y endpoint de sesiones con datos mock | Abrir la vista de sesiones | Se visualizan las sesiones con tema y estado | ✅ Pasa |
| CP-SES-02 | Mostrar badge de bitácora aprobada | Una sesión con bitácora aprobada en la lista | Abrir la vista de sesiones | Se muestra el badge Aprobada | ✅ Pasa |
| CP-SES-03 | Mostrar acción Ver bitácora o Registrar bitácora según corresponda | Una sesión con bitácora y otra sin bitácora | Abrir la vista de sesiones | Aparece Ver bitácora para la sesión con bitácora y Registrar bitácora para la sesión sin bitácora | ✅ Pasa |
| CP-SES-04 | Mostrar estado vacío cuando no hay sesiones | Endpoint de sesiones responde lista vacía | Abrir la vista de sesiones | Se muestra el mensaje Sin sesiones | ✅ Pasa |
| CP-SES-05 | Mostrar acción principal en el estado vacío | Endpoint de sesiones responde lista vacía | Abrir la vista de sesiones | Se muestra el botón Nueva sesión | ✅ Pasa |
| CP-SES-06 | Redirigir al login sin autenticación | Sin token en localStorage | Intentar acceder a /tutor/sesiones | La aplicación redirige a /login | ✅ Pasa |

### 2.5 Módulo de Usuarios - Coordinador

| ID | Funcionalidad | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|--------------|-------|--------------------|--------|
| CP-USR-01 | Mostrar la tabla de usuarios | Coordinador autenticado y endpoint de usuarios con datos mock | Abrir la pantalla de usuarios | Se muestran los registros de usuarios esperados | ✅ Pasa |
| CP-USR-02 | Mostrar badges de rol | Lista con usuarios de distintos roles | Abrir la pantalla de usuarios | Se ven etiquetas de Tutor, Beneficiario y Revisor | ✅ Pasa |
| CP-USR-03 | Abrir modal de nuevo usuario | Pantalla de usuarios cargada | Click en Nuevo usuario | Se abre el modal con campos de creación | ✅ Pasa |
| CP-USR-04 | Cerrar modal con cancelar | Modal de creación abierto | Click en Cancelar | El modal se cierra | ✅ Pasa |
| CP-USR-05 | Mostrar campos específicos al elegir rol tutor | Modal de creación abierto | Seleccionar rol tutor | Se muestran Matrícula, Carrera y Semestre | ✅ Pasa |
| CP-USR-06 | Filtrar usuarios por nombre | Lista con múltiples usuarios | Escribir Ana en el buscador | Solo se muestra el usuario que coincide | ✅ Pasa |
| CP-USR-07 | Filtrar usuarios por rol | Endpoint de usuarios preparado para el filtro | Seleccionar tutor en el filtro de rol | Solo aparecen usuarios con rol tutor | ✅ Pasa |
| CP-USR-08 | Validación de formulario vacío al crear | Modal de creación abierto | Click en Crear usuario sin capturar datos | Se muestran mensajes de obligatorio | ✅ Pasa |
| CP-USR-09 | Mostrar estado vacío cuando no hay usuarios | Endpoint de usuarios responde lista vacía | Recargar el módulo de usuarios | Se muestra el mensaje No hay usuarios registrados | ✅ Pasa |

### 2.6 Resumen de Cobertura de Pruebas

| Módulo | Total casos | Estado |
|--------|:-----------:|--------|
| Autenticación | 26 | Documentado |
| Bitácora - Tutor | 4 | Documentado |
| Revisión - Revisor | 4 | Documentado |
| Sesiones - Tutor | 6 | Documentado |
| Usuarios - Coordinador | 9 | Documentado |
| **TOTAL** | **49** | **Documentado** |

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
