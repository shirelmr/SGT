const FAKE_TOKEN = 'fake-tutor-token'
const FAKE_USER = { id_usuario: 1, nombre_completo: 'Test User', email: 'test_sgt_001@example.com', rol: 'tutor' }

const SESIONES_MOCK = [
  {
    id: 10,
    id_tutor: 1,
    id_beneficiario: 2,
    id_periodo: 1,
    fecha: '2026-05-10T00:00:00.000Z',
    hora_inicio: '10:00',
    duracion_hrs: 2,
    tema: 'Álgebra lineal',
    link_sesion: null,
    estado: 'realizada',
    tutor: { nombre_completo: 'Test User' },
    beneficiario: { nombre_completo: 'Ana Beneficiaria' },
    periodo: { nombre: 'Semestre 2026-1' },
    bitacora: { id_bitacora: 5, estado: 'aprobado' },
  },
  {
    id: 11,
    id_tutor: 1,
    id_beneficiario: 3,
    id_periodo: 1,
    fecha: '2026-05-15T00:00:00.000Z',
    hora_inicio: '12:00',
    duracion_hrs: 1,
    tema: 'Cálculo diferencial',
    link_sesion: null,
    estado: 'programada',
    tutor: { nombre_completo: 'Test User' },
    beneficiario: { nombre_completo: 'Luis Beneficiario' },
    periodo: { nombre: 'Semestre 2026-1' },
    bitacora: null,
  },
]

// Setea la sesión en localStorage antes de que la página cargue,
// evitando depender del flujo de login para tests de otras páginas.
function visitWithSession(path) {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', FAKE_TOKEN)
      win.localStorage.setItem('user', JSON.stringify(FAKE_USER))
      win.localStorage.setItem('rol', FAKE_USER.rol)
    },
  })
}

// ─── TC-01: Positivo — lista con sesiones y badges correctos ───────────────
describe('TC-01: Lista de sesiones del tutor con datos', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: SESIONES_MOCK }).as('getSesiones')
    visitWithSession('/tutor/sesiones')
    cy.wait('@getSesiones')
  })

  it('muestra las sesiones con su tema y estado', () => {
    cy.contains('Álgebra lineal').should('be.visible')
    cy.contains('Cálculo diferencial').should('be.visible')
    cy.contains('realizada').should('be.visible')
    cy.contains('programada').should('be.visible')
  })

  it('muestra el badge de bitácora aprobada en la sesión correspondiente', () => {
    cy.contains('Aprobada').should('be.visible')
  })

  it('muestra "Ver bitácora" en sesión con bitácora y "Registrar bitácora" en sesión sin bitácora', () => {
    cy.contains('Ver bitácora').should('be.visible')
    cy.contains('Registrar bitácora').should('be.visible')
  })
})

// ─── TC-02: Negativo — sin sesiones muestra EmptyState ────────────────────
describe('TC-02: Sin sesiones registradas muestra estado vacío', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: [] }).as('getSesionesVacias')
    visitWithSession('/tutor/sesiones')
    cy.wait('@getSesionesVacias')
  })

  it('muestra el mensaje "Sin sesiones"', () => {
    cy.contains('Sin sesiones').should('be.visible')
  })

  it('muestra el botón de acción para crear la primera sesión', () => {
    cy.contains('Nueva sesión').should('be.visible')
  })
})

// ─── TC-03: Negativo — sin autenticación redirige al login ────────────────
describe('TC-03: Acceso sin autenticación redirige al login', () => {
  it('redirige a /login al intentar acceder a /tutor/sesiones sin token', () => {
    cy.logout()
    cy.visit('/tutor/sesiones')
    cy.url().should('include', '/login')
  })
})
