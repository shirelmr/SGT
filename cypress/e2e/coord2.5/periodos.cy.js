const FAKE_TOKEN = 'fake-coord-token'
const FAKE_USER = {
  id_usuario: 99,
  nombre_completo: 'Coordinadora Prueba',
  email: 'coord@test.com',
  rol: 'coordinador',
}

const PERIODOS_MOCK = [
  {
    id: 1,
    nombre: 'Enero-Mayo 2026',
    fecha_inicio: '2026-01-15T00:00:00.000Z',
    fecha_fin: '2026-05-31T00:00:00.000Z',
    horas_max: 50,
    horas_esperadas: 40,
    activo: true,
  },
  {
    id: 2,
    nombre: 'Agosto-Diciembre 2025',
    fecha_inicio: '2025-08-15T00:00:00.000Z',
    fecha_fin: '2025-12-20T00:00:00.000Z',
    horas_max: 50,
    horas_esperadas: 40,
    activo: false,
  },
  {
    id: 3,
    nombre: 'Verano 2025',
    fecha_inicio: '2025-06-01T00:00:00.000Z',
    fecha_fin: '2025-07-31T00:00:00.000Z',
    horas_max: 30,
    horas_esperadas: 25,
    activo: false,
  },
]

function seedSession(win) {
  win.localStorage.setItem('token', FAKE_TOKEN)
  win.localStorage.setItem('user', JSON.stringify(FAKE_USER))
  win.localStorage.setItem('rol', FAKE_USER.rol)
}

function mockPeriodosGet(handler) {
  cy.intercept('GET', 'http://localhost:3000/api/periodos*', handler).as('getPeriodos')
}

function mockPeriodosPost(handler) {
  cy.intercept('POST', 'http://localhost:3000/api/periodos', handler).as('postPeriodos')
}

function mockPeriodosPatch(id, handler) {
  cy.intercept('PUT', `http://localhost:3000/api/periodos/${id}`, handler).as('putPeriodos')
}

function visitWithSession() {
  cy.visit('/coordinador/periodos', { onBeforeLoad: seedSession })
}

describe('Periodos', () => {
  beforeEach(() => {
    cy.logout()
  })

  // CP-COORD-PER-01
  it('redirects to login when accessing periodos without session', () => {
    cy.visit('/coordinador/periodos')
    cy.url().should('include', '/login')
  })

  // CP-COORD-PER-02
  it('renders periodos screen with valid coordinador session', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.contains('h1', 'Periodos').should('be.visible')
    cy.contains('Gestiona los periodos académicos').should('be.visible')
  })

  // CP-COORD-PER-03
  it('shows loading state while fetching periodos', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK, delay: 500 })
    visitWithSession()
    // Table component shows a spinner while loading
    cy.get('[class*="animate-spin"]').should('exist')
  })

  // CP-COORD-PER-04
  it('calls GET /periodos on initial load', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos').its('request.url').should('include', '/api/periodos')
  })

  // CP-COORD-PER-05
  it('sends Authorization Bearer token on periodos requests', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos').its('request.headers').should('have.property', 'authorization', `Bearer ${FAKE_TOKEN}`)
  })

  // CP-COORD-PER-06
  it('renders main periodos table columns and rows', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    
    // Check column headers
    cy.contains('th', 'Nombre').should('be.visible')
    cy.contains('th', 'Fecha inicio').should('be.visible')
    cy.contains('th', 'Fecha fin').should('be.visible')
    cy.contains('th', 'Horas máx.').should('be.visible')
    cy.contains('th', 'Estado').should('be.visible')
    
    // Check data rows
    cy.contains('td', 'Enero-Mayo 2026').should('be.visible')
    cy.contains('td', 'Agosto-Diciembre 2025').should('be.visible')
    cy.contains('td', '50').should('be.visible')
  })

  // CP-COORD-PER-07
  it('renders correct badge and label for each periodo status', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    
    // Check for active and inactive badges
    cy.contains('Activo').should('be.visible')
    cy.contains('Inactivo').should('be.visible')
  })

  // CP-COORD-PER-08
  it('opens create periodo modal from action button', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    
    cy.contains('button', 'Nuevo periodo').click()
    cy.contains('h2', 'Nuevo periodo').should('be.visible')
    cy.get('input[name="nombre"]').should('be.visible')
  })

  // CP-COORD-PER-09
  it('shows validation errors when submitting empty periodo form', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    
    cy.contains('button', 'Nuevo periodo').click()
    cy.contains('button', 'Crear periodo').click()
    
    // Check for validation errors
    cy.contains('Obligatorio').should('be.visible')
  })

  // CP-COORD-PER-10
  it('creates periodo successfully and refreshes list', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockPeriodosPost({ statusCode: 201, body: { id: 4, nombre: 'Nuevo Periodo' } })
    visitWithSession()
    cy.wait('@getPeriodos')
    
    // Setup second intercept for refresh after create
    cy.intercept('GET', 'http://localhost:3000/api/periodos*', {
      statusCode: 200,
      body: [...PERIODOS_MOCK, { id: 4, nombre: 'Nuevo Periodo', activo: false }]
    }).as('getPeriodosRefresh')
    
    cy.contains('button', 'Nuevo periodo').click()
    cy.get('input[name="nombre"]').type('Nuevo Periodo')
    cy.get('input[name="fecha_inicio"]').type('2026-06-10')
    cy.get('input[name="fecha_fin"]').type('2026-12-15')
    cy.get('input[name="horas_max"]').type('50')
    cy.get('input[name="horas_esperadas"]').type('40')
    cy.contains('button', 'Crear periodo').click()
    
    cy.wait('@postPeriodos')
    cy.contains('Periodo creado').should('be.visible')
    cy.wait('@getPeriodosRefresh')
  })

  // CP-COORD-PER-11
  it('shows duplicate conflict feedback when creating periodo', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockPeriodosPost({ statusCode: 409, body: { error: 'El periodo ya existe' } })
    visitWithSession()
    cy.wait('@getPeriodos')
    
    cy.contains('button', 'Nuevo periodo').click()
    cy.get('input[name="nombre"]').type('Enero-Mayo 2026')
    cy.get('input[name="fecha_inicio"]').type('2026-01-15')
    cy.get('input[name="fecha_fin"]').type('2026-05-31')
    cy.get('input[name="horas_max"]').type('50')
    cy.get('input[name="horas_esperadas"]').type('40')
    cy.contains('button', 'Crear periodo').click()
    
    cy.wait('@postPeriodos')
    cy.contains('El periodo ya existe').should('be.visible')
    // Modal should remain open
    cy.contains('h2', 'Nuevo periodo').should('be.visible')
  })

  // CP-COORD-PER-12
  it('opens edit periodo modal with preloaded data', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    
    // Click edit button on first row
    cy.contains('td', 'Enero-Mayo 2026').parents('tr').within(() => {
      cy.get('button').first().click()
    })
    
    cy.contains('h2', 'Editar periodo').should('be.visible')
    cy.get('input[name="nombre"]').should('have.value', 'Enero-Mayo 2026')
    cy.get('input[name="horas_max"]').should('have.value', '50')
  })

  // CP-COORD-PER-13
  it('updates periodo successfully and refreshes list', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    
    // Setup intercepts before opening edit modal
    cy.intercept('PUT', 'http://localhost:3000/api/periodos/*', {
      statusCode: 200, 
      body: { id: 1, nombre: 'Enero-Mayo 2026 Actualizado' }
    }).as('putPeriodos')
    
    const updatedMock = [...PERIODOS_MOCK]
    updatedMock[0] = { ...updatedMock[0], nombre: 'Enero-Mayo 2026 Actualizado' }
    cy.intercept('GET', 'http://localhost:3000/api/periodos*', {
      statusCode: 200,
      body: updatedMock
    }).as('getPeriodosRefresh')
    
    // Click edit button
    cy.contains('td', 'Enero-Mayo 2026').parents('tr').within(() => {
      cy.get('button').first().click()
    })
    
    cy.get('input[name="nombre"]').clear().type('Enero-Mayo 2026 Actualizado')
    cy.contains('button', 'Guardar cambios').click()
    
    cy.wait('@putPeriodos')
    cy.contains('Periodo actualizado').should('be.visible')
    cy.wait('@getPeriodosRefresh')
  })

  // CP-COORD-PER-14
  it('shows error feedback when create or update request fails', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockPeriodosPost({ statusCode: 500, body: { error: 'Error del servidor' } })
    visitWithSession()
    cy.wait('@getPeriodos')
    
    cy.contains('button', 'Nuevo periodo').click()
    cy.get('input[name="nombre"]').type('Test Periodo')
    cy.get('input[name="fecha_inicio"]').type('2026-06-10')
    cy.get('input[name="fecha_fin"]').type('2026-12-15')
    cy.get('input[name="horas_max"]').type('50')
    cy.get('input[name="horas_esperadas"]').type('40')
    cy.contains('button', 'Crear periodo').click()
    
    cy.wait('@postPeriodos')
    cy.contains('Error').should('be.visible')
    // Modal should remain open
    cy.contains('h2', 'Nuevo periodo').should('be.visible')
  })

  // CP-COORD-PER-15
  it('shows empty state when no periodos are available', () => {
    mockPeriodosGet({ statusCode: 200, body: [] })
    visitWithSession()
    cy.wait('@getPeriodos')
    
    cy.contains('No hay periodos registrados').should('be.visible')
  })

  // CP-COORD-PER-16
  it('does not trigger unrelated endpoint calls', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    
    // Setup intercepts for unrelated endpoints that should NOT be called
    cy.intercept('POST', 'http://localhost:3000/api/auth/login').as('loginCall')
    cy.intercept('POST', 'http://localhost:3000/api/auth/register').as('registerCall')
    cy.intercept('GET', 'http://localhost:3000/api/postulaciones*').as('postulacionesCall')
    
    visitWithSession()
    cy.wait('@getPeriodos')
    
    // Open and close modal
    cy.contains('button', 'Nuevo periodo').click()
    cy.contains('button', 'Cancelar').click()
    
    // Verify no unrelated calls were made
    cy.get('@loginCall.all').should('have.length', 0)
    cy.get('@registerCall.all').should('have.length', 0)
    cy.get('@postulacionesCall.all').should('have.length', 0)
  })
})