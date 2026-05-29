const FAKE_TOKEN = 'fake-coord-token'
const FAKE_USER = {
  id_usuario: 99,
  nombre_completo: 'Coordinadora Prueba',
  email: 'coord@test.com',
  rol: 'coordinador',
}

const USUARIOS_MOCK = [
  {
    id: 1,
    nombre_completo: 'Juan Perez',
    email: 'juan.perez@test.com',
    rol: 'tutor',
    matricula: 'A001',
    carrera: 'Ingenieria en Sistemas',
    semestre: 6,
  },
  {
    id: 2,
    nombre_completo: 'Maria Lopez',
    email: 'maria.lopez@test.com',
    rol: 'beneficiario',
    escuela: 'Bachillerato 16',
    grado_escolar: 3,
    id_periodo: 1,
  },
  {
    id: 3,
    nombre_completo: 'Carlos Ruiz',
    email: 'carlos.ruiz@test.com',
    rol: 'revisor',
  },
  {
    id: 4,
    nombre_completo: 'Ana Garcia',
    email: 'ana.garcia@test.com',
    rol: 'coordinador',
    departamento: 'Servicios Estudiantiles',
  },
]

function seedSession(win) {
  win.localStorage.setItem('token', FAKE_TOKEN)
  win.localStorage.setItem('user', JSON.stringify(FAKE_USER))
  win.localStorage.setItem('rol', FAKE_USER.rol)
}

function mockUsuariosGet(handler) {
  cy.intercept('GET', 'http://localhost:3000/api/usuarios*', handler).as('getUsuarios')
}

function mockPeriodosGet(data = []) {
  cy.intercept('GET', 'http://localhost:3000/api/periodos', { statusCode: 200, body: data }).as('getPeriodos')
}

function visitWithSession() {
  cy.visit('/coordinador/usuarios', { onBeforeLoad: seedSession })
}

describe('Usuarios Coordinador', () => {
  beforeEach(() => {
    cy.logout()
  })

  // CP-COORD-USR-01
  it('redirects to login when accessing usuarios without session', () => {
    cy.visit('/coordinador/usuarios')
    cy.url().should('include', '/login')
  })

  // CP-COORD-USR-02
  it('renders usuarios screen with valid coordinador session', () => {
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    mockPeriodosGet()
    visitWithSession()
    cy.wait('@getUsuarios')
    cy.contains('h1', 'Usuarios').should('be.visible')
    cy.contains('Gestiona los usuarios del sistema').should('be.visible')
  })

  // CP-COORD-USR-03
  it('calls GET /usuarios on initial load', () => {
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    mockPeriodosGet()
    visitWithSession()
    cy.wait('@getUsuarios').its('request.url').should('include', '/api/usuarios')
  })

  // CP-COORD-USR-04
  it('sends Authorization Bearer token on usuarios requests', () => {
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    mockPeriodosGet()
    visitWithSession()
    cy.wait('@getUsuarios').its('request.headers').should('have.property', 'authorization', `Bearer ${FAKE_TOKEN}`)
  })

  // CP-COORD-USR-05
  it('renders main usuarios table columns and rows', () => {
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    mockPeriodosGet()
    visitWithSession()
    cy.wait('@getUsuarios')
    
    // Check column headers
    cy.contains('th', 'Nombre').should('be.visible')
    cy.contains('th', 'Email').should('be.visible')
    cy.contains('th', 'Rol').should('be.visible')
    
    // Check data rows
    cy.contains('td', 'Juan Perez').should('be.visible')
    cy.contains('td', 'juan.perez@test.com').should('be.visible')
    cy.contains('td', 'Maria Lopez').should('be.visible')
    cy.contains('td', 'maria.lopez@test.com').should('be.visible')
  })

  // CP-COORD-USR-06
  it('renders correct role badges for listed users', () => {
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    mockPeriodosGet()
    visitWithSession()
    cy.wait('@getUsuarios')
    
    // Check for role badges - using contains with the role label
    cy.contains('Tutor').should('be.visible')
    cy.contains('Beneficiario').should('be.visible')
    cy.contains('Revisor').should('be.visible')
    cy.contains('Coordinador').should('be.visible')
  })

  // CP-COORD-USR-07
  it('filters usuarios by name from search input', () => {
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    mockPeriodosGet()
    visitWithSession()
    cy.wait('@getUsuarios')
    
    // All users visible initially
    cy.contains('td', 'Juan Perez').should('be.visible')
    cy.contains('td', 'Maria Lopez').should('be.visible')
    cy.contains('td', 'Carlos Ruiz').should('be.visible')
    
    // Type in search input
    cy.get('input[placeholder="Buscar por nombre..."]').type('maria')
    
    // Only Maria should be visible
    cy.contains('td', 'Maria Lopez').should('be.visible')
    cy.contains('td', 'Juan Perez').should('not.exist')
    cy.contains('td', 'Carlos Ruiz').should('not.exist')
  })

  // CP-COORD-USR-08
  it('filters usuarios by selected role', () => {
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    mockPeriodosGet()
    visitWithSession()
    cy.wait('@getUsuarios')
    
    // Setup new intercept for filtered response
    cy.intercept('GET', 'http://localhost:3000/api/usuarios*', (req) => {
      if (req.query.rol === 'tutor') {
        req.reply({ statusCode: 200, body: USUARIOS_MOCK.filter(u => u.rol === 'tutor') })
      } else {
        req.reply({ statusCode: 200, body: USUARIOS_MOCK })
      }
    }).as('getUsuariosFiltrados')
    
    // Select tutor role filter - the select elements are in order: search input, role filter, period filter
    cy.get('select').eq(0).select('tutor')
    
    // Verify API call with rol param
    cy.wait('@getUsuariosFiltrados').then((interception) => {
      expect(interception.request.url).to.include('rol=tutor')
    })
    
    // Only tutor should be visible
    cy.contains('td', 'Juan Perez').should('be.visible')
    cy.contains('td', 'Maria Lopez').should('not.exist')
  })

  // CP-COORD-USR-09
  it('shows empty state when no users are available', () => {
    mockUsuariosGet({ statusCode: 200, body: [] })
    mockPeriodosGet()
    visitWithSession()
    cy.wait('@getUsuarios')
    
    cy.contains('No hay usuarios registrados').should('be.visible')
  })
})
