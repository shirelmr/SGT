const FAKE_TOKEN = 'fake-coord-token'
const FAKE_USER = {
  id_usuario: 99,
  nombre_completo: 'Coordinadora Prueba',
  email: 'coord@test.com',
  rol: 'coordinador',
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function monthDate(monthOffset, day) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + monthOffset, day, 12, 0, 0).toISOString()
}

function lastSixMonthLabels() {
  const now = new Date()

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return MONTHS_ES[date.getMonth()]
  })
}

const USUARIOS_MOCK = [
  { id_usuario: 1, nombre_completo: 'Tutor Uno', rol: 'tutor' },
  { id_usuario: 2, nombre_completo: 'Tutor Dos', rol: 'tutor' },
  { id_usuario: 3, nombre_completo: 'Beneficiaria Uno', rol: 'beneficiario' },
  { id_usuario: 4, nombre_completo: 'Beneficiaria Dos', rol: 'beneficiario' },
  { id_usuario: 5, nombre_completo: 'Beneficiaria Tres', rol: 'beneficiario' },
  { id_usuario: 6, nombre_completo: 'Revisor Uno', rol: 'revisor' },
  { id_usuario: 7, nombre_completo: 'Coordinadora Prueba', rol: 'coordinador' },
]

const SESIONES_MOCK = [
  {
    id: 701,
    fecha: monthDate(0, 25),
    tema: 'Conversacion avanzada',
    estado: 'programada',
    tutor: { nombre_completo: 'Tutor Uno' },
    beneficiario: { nombre_completo: 'Beneficiaria Uno' },
  },
  {
    id: 702,
    fecha: monthDate(0, 20),
    tema: 'Listening B1',
    estado: 'realizada',
    tutor: { nombre_completo: 'Tutor Dos' },
    beneficiario: { nombre_completo: 'Beneficiaria Dos' },
  },
  {
    id: 703,
    fecha: monthDate(-1, 18),
    tema: 'Pronombres',
    estado: 'cancelada',
    tutor: { nombre_completo: 'Tutor Uno' },
    beneficiario: { nombre_completo: 'Beneficiaria Tres' },
  },
  {
    id: 704,
    fecha: monthDate(-2, 14),
    tema: 'Past simple review',
    estado: 'realizada',
    tutor: { nombre_completo: 'Tutor Dos' },
    beneficiario: { nombre_completo: 'Beneficiaria Uno' },
  },
  {
    id: 705,
    fecha: monthDate(-3, 10),
    tema: 'Used to',
    estado: 'programada',
    tutor: { nombre_completo: 'Tutor Uno' },
    beneficiario: { nombre_completo: 'Beneficiaria Dos' },
  },
  {
    id: 706,
    fecha: monthDate(-4, 8),
    tema: 'Reading practice',
    estado: 'realizada',
    tutor: { nombre_completo: 'Tutor Dos' },
    beneficiario: { nombre_completo: 'Beneficiaria Tres' },
  },
  {
    id: 707,
    fecha: monthDate(-5, 5),
    tema: 'Should not appear',
    estado: 'realizada',
    tutor: { nombre_completo: 'Tutor Uno' },
    beneficiario: { nombre_completo: 'Beneficiaria Uno' },
  },
]

const BITACORAS_MOCK = [
  { id_bitacora: 1, estado: 'pendiente' },
  { id_bitacora: 2, estado: 'pendiente' },
  { id_bitacora: 3, estado: 'aprobado' },
  { id_bitacora: 4, estado: 'rechazado' },
]

function seedSession(win) {
  win.localStorage.setItem('token', FAKE_TOKEN)
  win.localStorage.setItem('user', JSON.stringify(FAKE_USER))
  win.localStorage.setItem('rol', FAKE_USER.rol)
}

function mockDashboardRequests({
  usuarios = USUARIOS_MOCK,
  sesiones = SESIONES_MOCK,
  bitacoras = BITACORAS_MOCK,
  usuariosHandler,
  sesionesHandler,
  bitacorasHandler,
} = {}) {
  cy.intercept('GET', '**/usuarios', usuariosHandler || { statusCode: 200, body: usuarios }).as('getUsuarios')
  cy.intercept('GET', '**/sesiones', sesionesHandler || { statusCode: 200, body: sesiones }).as('getSesiones')
  cy.intercept('GET', '**/bitacoras', bitacorasHandler || { statusCode: 200, body: bitacoras }).as('getBitacoras')
}

function visitDashboardWithSession() {
  cy.visit('/coordinador/dashboard', {
    onBeforeLoad(win) {
      seedSession(win)
    },
  })
}

function waitDashboardRequests() {
  cy.wait('@getUsuarios')
  cy.wait('@getSesiones')
  cy.wait('@getBitacoras')
}

function assertCardValue(label, value) {
  cy.contains('p', label).siblings('p').should('have.text', String(value))
}

describe('Tablero Coordinador', () => {
  beforeEach(() => {
    cy.logout()
  })

  // CP-COORD-01
  it('redirects to login when accessing dashboard without session', () => {
    cy.visit('/coordinador/dashboard')

    cy.url().should('include', '/login')
  })

  // CP-COORD-02
  it('renders dashboard with valid coordinador session', () => {
    mockDashboardRequests()
    visitDashboardWithSession()
    waitDashboardRequests()

    cy.contains(/Buenos dias|Buenas tardes|Buenas noches|Buenos días/).should('be.visible')
    cy.contains('Coordinadora').should('be.visible')
    cy.contains(/Aqui tienes el resumen del sistema Talk!|Aquí tienes el resumen del sistema Talk!/).should('exist')
    cy.contains('Tutores Activos').should('be.visible')
    cy.contains('Beneficiarios').should('be.visible')
    cy.contains('Sesiones este mes').should('be.visible')
    cy.contains('Bitácoras pendientes').should('be.visible')
  })

  // CP-COORD-03
  it('shows loading spinner while dashboard data is pending', () => {
    mockDashboardRequests({
      usuariosHandler: { statusCode: 200, delay: 800, body: USUARIOS_MOCK },
      sesionesHandler: { statusCode: 200, delay: 800, body: SESIONES_MOCK },
      bitacorasHandler: { statusCode: 200, delay: 800, body: BITACORAS_MOCK },
    })

    visitDashboardWithSession()

    cy.get('.animate-spin').should('exist')
    waitDashboardRequests()
    cy.get('.animate-spin').should('not.exist')
  })

  // CP-COORD-04
  it('calls required endpoints: /usuarios, /sesiones, /bitacoras', () => {
    mockDashboardRequests()
    visitDashboardWithSession()
    waitDashboardRequests()

    cy.get('@getUsuarios.all').then((calls) => {
      expect(calls.length).to.be.at.least(1)
    })
    cy.get('@getSesiones.all').then((calls) => {
      expect(calls.length).to.be.at.least(1)
    })
    cy.get('@getBitacoras.all').then((calls) => {
      expect(calls.length).to.be.at.least(1)
    })
  })

  // CP-COORD-05
  it('sends Authorization Bearer token in dashboard requests', () => {
    const expectedHeader = `Bearer ${FAKE_TOKEN}`

    mockDashboardRequests({
      usuariosHandler: (req) => {
        expect(req.headers.authorization).to.eq(expectedHeader)
        req.reply({ statusCode: 200, body: USUARIOS_MOCK })
      },
      sesionesHandler: (req) => {
        expect(req.headers.authorization).to.eq(expectedHeader)
        req.reply({ statusCode: 200, body: SESIONES_MOCK })
      },
      bitacorasHandler: (req) => {
        expect(req.headers.authorization).to.eq(expectedHeader)
        req.reply({ statusCode: 200, body: BITACORAS_MOCK })
      },
    })

    visitDashboardWithSession()
    waitDashboardRequests()
  })

  // CP-COORD-06
  it('does not call unrelated endpoints from dashboard', () => {
    mockDashboardRequests()
    cy.intercept('POST', '**/api/auth/login').as('loginRequest')
    cy.intercept('POST', '**/api/auth/register').as('registerRequest')
    cy.intercept('POST', '**/api/postulaciones*').as('createPostulacionRequest')
    cy.intercept('PATCH', '**/api/postulaciones/*').as('updatePostulacionRequest')

    visitDashboardWithSession()
    waitDashboardRequests()

    cy.get('@loginRequest.all').should('have.length', 0)
    cy.get('@registerRequest.all').should('have.length', 0)
    cy.get('@createPostulacionRequest.all').should('have.length', 0)
    cy.get('@updatePostulacionRequest.all').should('have.length', 0)
  })

  // CP-COORD-07
  it('calculates Tutores Activos card correctly', () => {
    mockDashboardRequests()
    visitDashboardWithSession()
    waitDashboardRequests()

    assertCardValue('Tutores Activos', 2)
  })

  // CP-COORD-08
  it('calculates Beneficiarios card correctly', () => {
    mockDashboardRequests()
    visitDashboardWithSession()
    waitDashboardRequests()

    assertCardValue('Beneficiarios', 3)
  })

  // CP-COORD-09
  it('calculates Sesiones del mes card correctly', () => {
    mockDashboardRequests()
    visitDashboardWithSession()
    waitDashboardRequests()

    assertCardValue('Sesiones este mes', 2)
  })

  // CP-COORD-10
  it('calculates Bitácoras pendientes card correctly', () => {
    mockDashboardRequests()
    visitDashboardWithSession()
    waitDashboardRequests()

    assertCardValue('Bitácoras pendientes', 2)
  })

  // CP-COORD-11
  it('renders sesiones por mes bar chart with six months', () => {
    mockDashboardRequests()
    visitDashboardWithSession()
    waitDashboardRequests()

    cy.contains('Sesiones por mes').scrollIntoView().should('be.visible')
    cy.contains('Últimos 6 meses').should('be.visible')
    lastSixMonthLabels().forEach((monthLabel) => {
      cy.contains(monthLabel).should('exist')
    })
  })

  // CP-COORD-12
  it('renders bitácoras status donut chart correctly', () => {
    mockDashboardRequests()
    visitDashboardWithSession()
    waitDashboardRequests()

    cy.contains('Estado de bitácoras').scrollIntoView().should('be.visible')
    cy.contains('4 en total').should('be.visible')
    cy.contains('Pendientes').should('be.visible')
    cy.contains('Aprobadas').should('be.visible')
    cy.contains('Rechazadas').should('be.visible')
  })

  // CP-COORD-13
  it('shows empty state for bitácoras when total is zero', () => {
    mockDashboardRequests({ bitacoras: [] })
    visitDashboardWithSession()
    waitDashboardRequests()

    cy.contains('Estado de bitácoras').scrollIntoView().should('be.visible')
    cy.contains('0 en total').should('be.visible')
    cy.contains('Sin bitácoras registradas').should('be.visible')
  })

  // CP-COORD-14
  it('shows actividad reciente sorted descending and limited to five', () => {
    mockDashboardRequests()
    visitDashboardWithSession()
    waitDashboardRequests()

    cy.contains('h3', 'Actividad reciente').parent().within(() => {
      cy.get('li').should('have.length', 5)
      cy.get('li p.text-sm.font-medium.text-gray-800.truncate').then(($items) => {
        const topics = [...$items].map((item) => item.textContent.trim())

        expect(topics).to.deep.equal([
          'Conversacion avanzada',
          'Listening B1',
          'Pronombres',
          'Past simple review',
          'Used to',
        ])
      })
      cy.contains('Should not appear').should('not.exist')
    })
  })

  // CP-COORD-15
  it('renders with partial data when one endpoint fails', () => {
    mockDashboardRequests({
      usuariosHandler: { statusCode: 500, body: { error: 'fallo usuarios' } },
    })
    visitDashboardWithSession()
    waitDashboardRequests()

    cy.contains('Sesiones por mes').should('be.visible')
    assertCardValue('Tutores Activos', 0)
    assertCardValue('Beneficiarios', 0)
    assertCardValue('Sesiones este mes', 2)
    assertCardValue('Bitácoras pendientes', 2)
  })

  // CP-COORD-16
  it('handles 401 by clearing localStorage and redirecting to login', () => {
    mockDashboardRequests({
      usuariosHandler: { statusCode: 401, body: { error: 'No autorizado' } },
      sesionesHandler: { statusCode: 200, body: SESIONES_MOCK },
      bitacorasHandler: { statusCode: 200, body: BITACORAS_MOCK },
    })

    visitDashboardWithSession()

    cy.url().should('include', '/login')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.eq(null)
      expect(win.localStorage.getItem('user')).to.eq(null)
      expect(win.localStorage.getItem('rol')).to.eq(null)
    })
  })
})