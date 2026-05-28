const FAKE_TOKEN = 'fake-tutor-token'
const FAKE_USER = {
  id_usuario: 1,
  nombre_completo: 'Test User',
  email: 'test_sgt_001@example.com',
  rol: 'tutor',
}

// Helper para construir una fecha futura segura en formato YYYY-MM-DDT00:00:00.000Z
function futureISO(daysAhead = 7) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00.000Z`
}

function pastISO(daysAgo = 2) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00.000Z`
}

const HORAS_MOCK = [
  {
    horas_impartidas: 12,
    horas_extra: 3,
    porcentaje_acred: 24,
    periodo_activo: true,
    periodo: { nombre: 'Semestre 2026-1', horas_esperadas: 50, horas_max: 180, activo: true },
  },
]

const SESIONES_MOCK = [
  {
    id: 101,
    id_tutor: 1,
    id_beneficiario: 2,
    id_periodo: 1,
    fecha: pastISO(3),
    hora_inicio: '09:00',
    duracion_hrs: 1,
    tema: 'Verb to be',
    estado: 'realizada',
    tutor: { nombre_completo: 'Test User' },
    beneficiario: { nombre_completo: 'Ana Beneficiaria' },
    periodo: { nombre: 'Semestre 2026-1', activo: true },
    bitacora: { id_bitacora: 50, estado: 'aprobado' },
  },
  {
    id: 102,
    id_tutor: 1,
    id_beneficiario: 3,
    id_periodo: 1,
    fecha: pastISO(5),
    hora_inicio: '10:00',
    duracion_hrs: 2,
    tema: 'Present Perfect',
    estado: 'realizada',
    tutor: { nombre_completo: 'Test User' },
    beneficiario: { nombre_completo: 'Luis Beneficiario' },
    periodo: { nombre: 'Semestre 2026-1', activo: true },
    bitacora: { id_bitacora: 51, estado: 'pendiente' },
  },
  {
    id: 103,
    id_tutor: 1,
    id_beneficiario: 4,
    id_periodo: 1,
    fecha: futureISO(5),
    hora_inicio: '15:00',
    duracion_hrs: 1.5,
    tema: 'Past simple',
    estado: 'programada',
    tutor: { nombre_completo: 'Test User' },
    beneficiario: { nombre_completo: 'Carla Beneficiaria' },
    periodo: { nombre: 'Semestre 2026-1', activo: true },
    bitacora: null,
  },
]

// Sesiones realizadas sin bitácora (pendientes) — usa fecha pasada para que aparezcan
const SESIONES_CON_PENDIENTES = [
  ...SESIONES_MOCK,
  {
    id: 104,
    id_tutor: 1,
    id_beneficiario: 5,
    id_periodo: 1,
    fecha: pastISO(1),
    hora_inicio: '08:00',
    duracion_hrs: 1,
    tema: 'Conditional sentences',
    estado: 'realizada',
    tutor: { nombre_completo: 'Test User' },
    beneficiario: { nombre_completo: 'Mario Beneficiario' },
    periodo: { nombre: 'Semestre 2026-1', activo: true },
    bitacora: null,
  },
]

function visitWithSession(path) {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', FAKE_TOKEN)
      win.localStorage.setItem('user', JSON.stringify(FAKE_USER))
      win.localStorage.setItem('rol', FAKE_USER.rol)
    },
  })
}

describe('Tablero del tutor (Dashboard)', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: SESIONES_MOCK }).as('getSesiones')
    cy.intercept('GET', '/api/horas-acreditadas', { statusCode: 200, body: HORAS_MOCK }).as('getHoras')
    cy.intercept('GET', '/api/asistencias/*', { statusCode: 200, body: { confirma_tutor: false } }).as('getAsistencia')
  })

  // CP-TUTOR-01
  it('muestra el saludo personalizado con el primer nombre y la frase de resumen', () => {
    visitWithSession('/tutor/dashboard')
    cy.wait('@getSesiones')
    cy.wait('@getHoras')
    cy.contains(/Buenos días|Buenas tardes|Buenas noches/).should('be.visible')
    cy.contains('Test').should('be.visible')
    cy.contains('Aquí tienes el resumen de tu actividad').should('be.visible')
  })

  // CP-TUTOR-02
  it('renderiza las 4 KPI cards', () => {
    visitWithSession('/tutor/dashboard')
    cy.wait('@getSesiones')
    cy.wait('@getHoras')
    cy.contains('Sesiones realizadas').should('be.visible')
    cy.contains('Horas impartidas').should('be.visible')
    cy.contains('Bitácoras pendientes').should('be.visible')
    cy.contains('% Acreditado').should('be.visible')
  })

  // CP-TUTOR-03
  it('muestra la próxima sesión con tema, hora y duración', () => {
    visitWithSession('/tutor/dashboard')
    cy.wait('@getSesiones')
    cy.wait('@getHoras')
    cy.contains('Próxima Sesión').should('be.visible')
    cy.contains('Past simple').should('be.visible')
    cy.contains('15:00').should('be.visible')
  })

  // CP-TUTOR-04
  it('muestra mensaje cuando no hay próxima sesión programada', () => {
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: [] }).as('getSesionesVacias')
    visitWithSession('/tutor/dashboard')
    cy.wait('@getSesionesVacias')
    cy.wait('@getHoras')
    cy.contains('No hay sesiones programadas próximamente.').should('be.visible')
  })

  // CP-TUTOR-05
  it('lista las bitácoras pendientes cuando hay sesiones realizadas sin bitácora', () => {
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: SESIONES_CON_PENDIENTES }).as('getSesionesPend')
    visitWithSession('/tutor/dashboard')
    cy.wait('@getSesionesPend')
    cy.wait('@getHoras')
    cy.contains('Bitácoras Pendientes').should('be.visible')
    cy.contains('Conditional sentences').scrollIntoView().should('be.visible')
  })

  // CP-TUTOR-06
  it('muestra el estado vacío "No hay sesiones registradas aún" en Últimas Sesiones cuando no hay datos', () => {
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: [] }).as('getSesionesVacias')
    visitWithSession('/tutor/dashboard')
    cy.wait('@getSesionesVacias')
    cy.wait('@getHoras')
    cy.contains('Últimas Sesiones').scrollIntoView().should('be.visible')
    cy.contains('No hay sesiones registradas aún').should('be.visible')
  })

  // CP-TUTOR-07
  it('renderiza la lista de últimas sesiones con los labels Sesión y Bitácora', () => {
    visitWithSession('/tutor/dashboard')
    cy.wait('@getSesiones')
    cy.wait('@getHoras')
    cy.contains('Últimas Sesiones').scrollIntoView().should('be.visible')
    cy.contains('Verb to be').scrollIntoView().should('be.visible')
    cy.contains('Present Perfect').should('be.visible')
    cy.contains('Sesión:').should('be.visible')
    cy.contains('Bitácora:').should('be.visible')
    cy.contains('Aprobada').should('be.visible')
    cy.contains('Pendiente de revisión').should('be.visible')
  })

  // CP-TUTOR-08
  it('redirige a /login si se intenta acceder sin autenticación', () => {
    cy.logout()
    cy.visit('/tutor/dashboard')
    cy.url().should('include', '/login')
  })
})
