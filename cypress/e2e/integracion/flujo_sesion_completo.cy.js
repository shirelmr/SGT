// =============================================================================
// TESTS DE INTEGRACIÓN ENTRE ROLES
// Flujo: Tutor crea sesión → registra bitácora → Revisor aprueba/rechaza →
//        Coordinador ve horas acreditadas → Beneficiario ve impacto/progreso
// =============================================================================

// ─── IDs compartidos a lo largo de todos los escenarios ─────────────────────
const SESION_ID   = 11
const BITACORA_ID = 99
const HORAS_ID    = 5

// ─── Usuarios por rol ────────────────────────────────────────────────────────
const USERS = {
  tutor:       { id_usuario: 1, nombre_completo: 'Test Tutor',       email: 'tutor@test.com',   rol: 'tutor'        },
  revisor:     { id_usuario: 2, nombre_completo: 'Test Revisor',     email: 'revisor@test.com', rol: 'revisor'      },
  coordinador: { id_usuario: 3, nombre_completo: 'Test Coordinador', email: 'coord@test.com',   rol: 'coordinador'  },
  beneficiario:{ id_usuario: 4, nombre_completo: 'Ana Beneficiaria', email: 'benef@test.com',   rol: 'beneficiario' },
}

// ─── Mock de sesión ──────────────────────────────────────────────────────────
const SESION_REALIZADA = {
  id: SESION_ID,
  tema: 'Verb To Be - Present Simple',
  duracion_hrs: 2,
  estado: 'realizada',
  bitacora: null,
  tutor:        { nombre_completo: 'Test Tutor' },
  beneficiario: { nombre_completo: 'Ana Beneficiaria' },
  periodo:      { id: 1, nombre: 'Semestre 2026-1', activo: true },
}

// ─── Mock de bitácora en sus distintos estados ───────────────────────────────
const BITACORA_PENDIENTE = {
  id:            BITACORA_ID,
  id_sesion:     SESION_ID,
  estado:        'pendiente',
  actividades:   'Se explicó la estructura del Present Simple con ejercicios prácticos y ejemplos cotidianos',
  logros:        'El estudiante comprendió la conjugación y elaboró oraciones propias',
  dificultades:  'Confusión inicial con los verbos irregulares más comunes',
  plan_siguiente:'Practicar con ejercicios de conversación y diálogos en clase',
  evidencia:     null,
  sesion: {
    id_sesion:    SESION_ID,
    tema:         'Verb To Be - Present Simple',
    duracion_hrs: 2,
    tutor:        { nombre_completo: 'Test Tutor' },
    beneficiario: { nombre_completo: 'Ana Beneficiaria' },
  },
}

const BITACORA_APROBADA  = { ...BITACORA_PENDIENTE, estado: 'aprobado'          }
const BITACORA_RECHAZADA = { ...BITACORA_PENDIENTE, estado: 'no_aprobada'       }
const BITACORA_SIN_HORAS = { ...BITACORA_PENDIENTE, estado: 'aprobado_sin_horas'}

// ─── Mock de horas acreditadas ───────────────────────────────────────────────
const PERIODOS_MOCK = [
  { id: 1, nombre: 'Semestre 2026-1', activo: true, horas_esperadas: 40 },
]

const HORAS_CON_APROBACION = {
  id_horas_acreditadas: HORAS_ID,
  horas_impartidas: 2,
  horas_extra: 0,
  porcentaje_acred: 5,
  tutor:   { usuario: { nombre_completo: 'Test Tutor' } },
  periodo: { horas_esperadas: 40 },
}

const HORAS_SIN_APROBACION = {
  ...HORAS_CON_APROBACION,
  horas_impartidas: 0,
  porcentaje_acred: 0,
}

// ─── Helper: visitar página con sesión de rol inyectada en localStorage ──────
function visitAs(rol, path) {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', `fake-${rol}-token`)
      win.localStorage.setItem('user', JSON.stringify(USERS[rol]))
      win.localStorage.setItem('rol', rol)
    },
  })
}

// =============================================================================
// INT-01 | FLUJO FELIZ COMPLETO
// Tutor crea sesión → registra bitácora → Revisor aprueba →
// Coordinador ve horas → Beneficiario ve avance
// =============================================================================
describe('INT-01 | Flujo feliz completo entre roles', () => {

  it('Paso 1 — Tutor crea una sesión y es redirigido a /tutor/sesiones', () => {
    cy.intercept('GET', '/api/tutor/mis-beneficiarios', {
      statusCode: 200,
      body: [{ id_benef: 4, nombre_completo: 'Ana Beneficiaria' }],
    }).as('getBeneficiarios')
    cy.intercept('POST', '/api/sesiones', {
      statusCode: 201,
      body: { ...SESION_REALIZADA, estado: 'programada' },
    }).as('createSesion')
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: [] }).as('getSesiones')

    visitAs('tutor', '/tutor/sesiones/nueva')
    cy.wait('@getBeneficiarios')

    cy.contains('Ana Beneficiaria').click()
    cy.get('input[type="date"]').type('2026-06-10')
    cy.get('input[type="time"]').type('10:00')
    cy.contains('label', 'Duración (horas)').parent().find('input').type('2')
    cy.get('select').select('realizada')
    cy.get('input[placeholder*="Verb to be"]').type('Verb To Be - Present Simple')

    cy.get('button[type="submit"]').click()

    cy.wait('@createSesion').then((interception) => {
      expect(interception.request.body).to.include({
        fecha:       '2026-06-10',
        hora_inicio: '10:00',
        tema:        'Verb To Be - Present Simple',
      })
      expect(interception.request.body.ids_beneficiarios).to.include(4)
    })
    cy.url().should('include', '/tutor/sesiones')
  })

  it('Paso 2 — Tutor registra bitácora de la sesión realizada', () => {
    cy.intercept('GET', '/api/sesiones',         { statusCode: 200, body: [SESION_REALIZADA] }).as('getSesiones')
    cy.intercept('GET', `/api/sesiones/${SESION_ID}`,  { statusCode: 200, body: SESION_REALIZADA }).as('getSesion')
    cy.intercept('GET', `/api/bitacoras/${SESION_ID}`, { statusCode: 404, body: { error: 'No encontrada' } }).as('getBitacoraVacia')
    cy.intercept('POST', '/api/bitacoras', { statusCode: 201, body: BITACORA_PENDIENTE }).as('createBitacora')

    visitAs('tutor', '/tutor/sesiones')
    cy.wait('@getSesiones')

    cy.contains('button', 'Registrar bitácora').first().click({ force: true })
    cy.wait('@getSesion')
    cy.wait('@getBitacoraVacia')
    cy.get('textarea', { timeout: 10000 }).should('exist')

    cy.get('textarea').eq(0).type(BITACORA_PENDIENTE.actividades,    { delay: 5 })
    cy.get('textarea').eq(1).type(BITACORA_PENDIENTE.logros,         { delay: 5 })
    cy.get('textarea').eq(2).type(BITACORA_PENDIENTE.dificultades,   { delay: 5 })
    cy.get('textarea').eq(3).type(BITACORA_PENDIENTE.plan_siguiente, { delay: 5 })

    cy.contains('button', /Registrar bitácora|Guardar/).click()

    cy.wait('@createBitacora').its('request.body').should('include', { id_sesion: SESION_ID })
    cy.contains('Bitácora registrada').should('be.visible')
  })

  it('Paso 3 — Revisor aprueba la bitácora pendiente del tutor', () => {
    cy.intercept('GET', `**/api/bitacoras/${BITACORA_ID}`,        { statusCode: 200, body: BITACORA_PENDIENTE }).as('getBitacora')
    cy.intercept('GET', `**/api/comentarios/${BITACORA_ID}`,      { statusCode: 200, body: [] }).as('getComentarios')
    cy.intercept('GET', `**/api/incidencias/sesion/${SESION_ID}`, { statusCode: 200, body: [] }).as('getIncidencias')
    cy.intercept('PUT', `**/api/bitacoras/${BITACORA_ID}`,        { statusCode: 200, body: BITACORA_APROBADA }).as('updateBitacora')

    visitAs('revisor', `/revisor/bitacoras/${BITACORA_ID}`)
    cy.wait(['@getBitacora', '@getComentarios', '@getIncidencias'])

    cy.get('select').select('aprobado')

    cy.wait('@updateBitacora').its('request.body.estado').should('eq', 'aprobado')
    cy.contains('Bitácora aprobada y horas acreditadas').should('be.visible')
  })

  it('Paso 4 — Coordinador ve las 2 horas impartidas por el tutor tras la aprobación', () => {
    cy.intercept('GET', 'http://localhost:3000/api/periodos*',          { statusCode: 200, body: PERIODOS_MOCK       }).as('getPeriodos')
    cy.intercept('GET', 'http://localhost:3000/api/horas-acreditadas*', { statusCode: 200, body: [HORAS_CON_APROBACION] }).as('getHoras')

    visitAs('coordinador', '/coordinador/horas')
    cy.wait('@getPeriodos')
    cy.wait('@getHoras')

    cy.contains('Test Tutor').should('be.visible')
    cy.contains('2 / 40 hrs esperadas').should('be.visible')
    cy.contains('5%').should('be.visible')
  })

  it('Paso 5 — Beneficiario ve su examen de inicio; examen de término aún pendiente', () => {
    cy.intercept('GET', '/api/beneficiario-periodo/mi-progreso', {
      statusCode: 200,
      body: {
        pct_examen_inicio:  45,
        fecha_examen_inicio:'2026-05-05T00:00:00.000Z',
        pct_examen_termino: null,
      },
    }).as('getProgreso')

    visitAs('beneficiario', '/beneficiario/progreso')
    cy.wait('@getProgreso')

    cy.contains('Examen de Inicio').should('be.visible')
    cy.contains('45%').should('be.visible')
    cy.contains('Aún no aplicado.').should('be.visible')
    cy.contains('El avance se calculará cuando tengas ambos exámenes registrados').should('be.visible')
  })
})

// =============================================================================
// INT-02 | REVISOR RECHAZA BITÁCORA
// Revisor rechaza con comentario → tutor ve retroalimentación →
// coordinador no ve horas nuevas
// =============================================================================
describe('INT-02 | Bitácora rechazada — coordinador no ve horas + tutor ve comentario', () => {

  beforeEach(() => {
    cy.logout() // Clear any previous state
  })

  it('Revisor rechaza bitácora y deja comentario obligatorio de motivo', () => {
    const MOTIVO = 'Falta evidencia del quiz aplicado en clase.'

    cy.intercept('GET', `**/api/bitacoras/${BITACORA_ID}`,        { statusCode: 200, body: BITACORA_PENDIENTE }).as('getBitacora')
    cy.intercept('GET', `**/api/comentarios/${BITACORA_ID}`,      { statusCode: 200, body: [] }).as('getComentarios')
    cy.intercept('GET', `**/api/incidencias/sesion/${SESION_ID}`, { statusCode: 200, body: [] }).as('getIncidencias')
    cy.intercept('PUT', `**/api/bitacoras/${BITACORA_ID}`,        { statusCode: 200, body: BITACORA_RECHAZADA }).as('updateBitacora')
    cy.intercept('POST', '**/api/comentarios', {
      statusCode: 201,
      body: { id: 10, id_bitacora: BITACORA_ID, texto: MOTIVO },
    }).as('createComentario')
    cy.intercept('GET', `**/api/comentarios/${BITACORA_ID}`, {
      statusCode: 200,
      body: [{ id: 10, texto: MOTIVO, fecha_creacion: new Date().toISOString(), revisor: { nombre_completo: 'Test Revisor' } }],
    }).as('getComentariosRefresh')

    visitAs('revisor', `/revisor/bitacoras/${BITACORA_ID}`)
    
    cy.wait('@getBitacora')
    cy.wait('@getIncidencias', { timeout: 10000 })
    // Don't wait for getComentarios - let Promise.allSettled handle it

    // Wait for page to fully load
    cy.contains('Detalle Bitácora', { timeout: 10000 }).should('be.visible')
    
    cy.get('select', { timeout: 10000 }).should('be.visible').select('no_aprobada')
    cy.wait(500) // Give modal time to appear
    cy.contains('Notificación al Tutor', { timeout: 10000 }).should('be.visible')

    cy.get('textarea:visible').last().clear().type(MOTIVO)
    cy.contains('button', 'Confirmar y Guardar').click()

    cy.wait('@updateBitacora').its('request.body.estado').should('eq', 'no_aprobada')
    cy.contains('Estado actualizado y motivo enviado').should('be.visible')
    cy.contains(MOTIVO).should('be.visible')
  })

  it('Tutor ve el comentario de rechazo del revisor al abrir su bitácora', () => {
    const COMENTARIO_RECHAZO = 'Falta evidencia del quiz aplicado en clase.'

    cy.intercept('GET', `**/api/sesiones/${SESION_ID}`,  { statusCode: 200, body: SESION_REALIZADA }).as('getSesion')
    cy.intercept('GET', `**/api/bitacoras/${SESION_ID}`, { 
      statusCode: 200, 
      body: { ...BITACORA_RECHAZADA, id: BITACORA_ID } 
    }).as('getBitacora')
    cy.intercept('GET', `**/api/comentarios/${BITACORA_ID}`, {
      statusCode: 200,
      body: [{ id: 10, texto: COMENTARIO_RECHAZO, fecha_creacion: new Date().toISOString(), revisor: { nombre_completo: 'Test Revisor' } }],
    }).as('getComentarios')
    cy.intercept('PATCH', `**/api/comentarios/${BITACORA_ID}/leidos`, { statusCode: 200, body: {} }).as('marcarLeidos')

    visitAs('tutor', `/tutor/sesiones/${SESION_ID}/bitacora`)
    
    cy.wait('@getSesion')
    cy.wait('@getBitacora')

    cy.contains(COMENTARIO_RECHAZO, { timeout: 10000 }).should('exist')
  })

  it('Coordinador ve 0 horas impartidas porque la bitácora fue rechazada', () => {
    cy.intercept('GET', 'http://localhost:3000/api/periodos*',          { statusCode: 200, body: PERIODOS_MOCK          }).as('getPeriodos')
    cy.intercept('GET', 'http://localhost:3000/api/horas-acreditadas*', { statusCode: 200, body: [HORAS_SIN_APROBACION] }).as('getHoras')

    visitAs('coordinador', '/coordinador/horas')
    cy.wait('@getPeriodos')
    cy.wait('@getHoras')

    cy.contains('Test Tutor').should('be.visible')
    cy.contains('0 / 40 hrs esperadas').should('be.visible')
    cy.contains('0%').should('be.visible')
  })
})

// =============================================================================
// INT-03 | APROBADO SIN HORAS
// Revisor marca sesión sin horas (beneficiario no se presentó) →
// coordinador acredita horas extra manualmente
// =============================================================================
describe('INT-03 | Aprobado sin horas — coordinador acredita horas extra manualmente', () => {

  it('Revisor aprueba la bitácora sin contar horas con motivo obligatorio', () => {
    const MOTIVO = 'El beneficiario no se presentó. Se aprueba sin contar horas impartidas.'

    cy.intercept('GET', `**/api/bitacoras/${BITACORA_ID}`,        { statusCode: 200, body: BITACORA_PENDIENTE }).as('getBitacora')
    cy.intercept('GET', `**/api/comentarios/${BITACORA_ID}`,      { statusCode: 200, body: [] }).as('getComentarios')
    cy.intercept('GET', `**/api/incidencias/sesion/${SESION_ID}`, { statusCode: 200, body: [] }).as('getIncidencias')
    cy.intercept('PUT', `**/api/bitacoras/${BITACORA_ID}`,        { statusCode: 200, body: BITACORA_SIN_HORAS }).as('updateBitacora')
    cy.intercept('POST', '**/api/comentarios', { statusCode: 201 }).as('createComentario')

    visitAs('revisor', `/revisor/bitacoras/${BITACORA_ID}`)
    cy.wait(['@getBitacora', '@getComentarios', '@getIncidencias'])

    cy.get('select').select('aprobado_sin_horas')
    cy.get('textarea[placeholder="Escribe el motivo obligatorio aquí..."]').type(MOTIVO)
    cy.contains('button', 'Confirmar y Guardar').click()

    cy.wait('@updateBitacora').its('request.body.estado').should('eq', 'aprobado_sin_horas')
    cy.contains('Sesión aprobada sin horas. Comentario guardado.').should('be.visible')
  })

  it('Coordinador ve 0 horas impartidas y agrega horas extra al tutor manualmente', () => {
    cy.intercept('GET', 'http://localhost:3000/api/periodos*',          { statusCode: 200, body: PERIODOS_MOCK          }).as('getPeriodos')
    cy.intercept('GET', 'http://localhost:3000/api/horas-acreditadas*', { statusCode: 200, body: [HORAS_SIN_APROBACION] }).as('getHoras')
    cy.intercept('PATCH', `http://localhost:3000/api/horas-acreditadas/${HORAS_ID}/horas-extra`, {
      statusCode: 200,
      body: { ...HORAS_SIN_APROBACION, horas_extra: 1, porcentaje_acred: 2.5 },
    }).as('patchHoras')

    visitAs('coordinador', '/coordinador/horas')
    cy.wait('@getPeriodos')
    cy.wait('@getHoras')

    cy.contains('0%').should('be.visible')

    cy.contains('button', '+ Horas extra').first().click()
    cy.contains('Agregar horas extra').should('be.visible')
    cy.get('input[type="number"]').type('1')
    cy.contains('button', 'Agregar').click()

    cy.wait('@patchHoras').its('request.body.horas').should('eq', 1)
    cy.contains('horas extra agregadas').should('be.visible')
  })
})

// =============================================================================
// INT-04 | PROGRESO DEL BENEFICIARIO
// Beneficiario ve cómo sus exámenes reflejan el impacto de las tutorías
// =============================================================================
describe('INT-04 | Beneficiario ve impacto de las tutorías en sus exámenes', () => {

  it('Solo con examen de inicio: beneficiario ve el porcentaje y el de término como pendiente', () => {
    cy.intercept('GET', '/api/beneficiario-periodo/mi-progreso', {
      statusCode: 200,
      body: {
        pct_examen_inicio:  45,
        fecha_examen_inicio:'2026-05-05T00:00:00.000Z',
        pct_examen_termino: null,
      },
    }).as('getProgreso')

    visitAs('beneficiario', '/beneficiario/progreso')
    cy.wait('@getProgreso')

    cy.contains('Examen de Inicio').should('be.visible')
    cy.contains('45%').should('be.visible')
    cy.contains('Examen de Término').should('be.visible')
    cy.contains('Aún no aplicado.').should('be.visible')
    cy.contains('El avance se calculará cuando tengas ambos exámenes registrados').should('be.visible')
  })

  it('Con ambos exámenes: muestra avance = diferencia entre inicio y término (30%)', () => {
    cy.intercept('GET', '/api/beneficiario-periodo/mi-progreso', {
      statusCode: 200,
      body: {
        pct_examen_inicio:    45, fecha_examen_inicio:   '2026-05-05T00:00:00.000Z',
        pct_examen_termino:   75, fecha_examen_termino:  '2026-08-20T00:00:00.000Z',
      },
    }).as('getProgreso')

    visitAs('beneficiario', '/beneficiario/progreso')
    cy.wait('@getProgreso')

    cy.contains('45%').should('be.visible')     // examen inicio
    cy.contains('75%').should('be.visible')     // examen término
    cy.contains('Avance General').should('be.visible')
    cy.contains('30%').should('be.visible')     // avance = 75 - 45
    cy.contains('¡Estás comenzando! Sigue adelante.').should('be.visible')
  })

  it('Beneficiario sin ningún examen registrado ve ambas secciones vacías', () => {
    cy.intercept('GET', '/api/beneficiario-periodo/mi-progreso', {
      statusCode: 200,
      body: { pct_examen_inicio: null, pct_examen_termino: null },
    }).as('getProgreso')

    visitAs('beneficiario', '/beneficiario/progreso')
    cy.wait('@getProgreso')

    cy.contains('Examen aún no aplicado.').should('be.visible')
    cy.contains('Aún no aplicado.').should('be.visible')
    cy.contains('El avance se calculará cuando tengas ambos exámenes registrados').should('be.visible')
  })
})

// =============================================================================
// INT-05 | AISLAMIENTO DE ROLES
// Cada rol solo puede acceder a sus propias rutas; cualquier intento
// de cruzar roles redirige al dashboard propio o al login
// =============================================================================
describe('INT-05 | Aislamiento de roles — cada usuario solo accede a su módulo', () => {

  it('Tutor no puede acceder a /coordinador/horas — redirige a /tutor/dashboard', () => {
    visitAs('tutor', '/coordinador/horas')
    cy.url().should('include', '/tutor/dashboard')
  })

  it('Beneficiario no puede acceder a /revisor/bitacoras — redirige a /beneficiario/dashboard', () => {
    visitAs('beneficiario', '/revisor/bitacoras')
    cy.url().should('match', /\/(beneficiario\/dashboard|login)$/)
  })

  it('Revisor no puede acceder a /coordinador/postulaciones — redirige a /revisor/dashboard', () => {
    visitAs('revisor', '/coordinador/postulaciones')
    cy.url().should('match', /\/(revisor\/dashboard|login)$/)
  })

  it('Coordinador no puede acceder a /tutor/sesiones — redirige a /coordinador/dashboard', () => {
    visitAs('coordinador', '/tutor/sesiones')
    cy.url().should('include', '/coordinador/dashboard')
  })

  it('Rutas protegidas sin autenticación redirigen a /login', () => {
    cy.logout()
    ;[
      '/tutor/sesiones',
      '/revisor/bitacoras',
      '/coordinador/horas',
      '/beneficiario/progreso',
    ].forEach((route) => {
      cy.visit(route)
      cy.url().should('include', '/login')
    })
  })
})
