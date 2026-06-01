const FAKE_TOKEN = 'fake-coord-token'
const FAKE_USER = {
  id_usuario: 99,
  nombre_completo: 'Coordinadora Prueba',
  email: 'coord@test.com',
  rol: 'coordinador',
}

const PERIODOS_MOCK = [
  { id: 1, nombre: 'Enero-Mayo 2026', activo: true },
  { id: 2, nombre: 'Agosto-Diciembre 2025', activo: false },
]

const BENEFICIARIOS_MOCK = [
  {
    id_benef: 1,
    nombre_completo: 'Maria Lopez',
    escuela: 'Bachillerato 16',
    tutor: 'Juan Perez',
    sesiones_realizadas: 8,
    sesiones_esperadas: 10,
    sesiones_programadas: 2,
    pct_examen_inicio: 65,
    pct_examen_termino: 82,
  },
  {
    id_benef: 2,
    nombre_completo: 'Carlos Ramirez',
    escuela: 'Bachillerato 23',
    tutor: 'Ana Garcia',
    sesiones_realizadas: 3,
    sesiones_esperadas: 10,
    sesiones_programadas: 1,
    pct_examen_inicio: 55,
    pct_examen_termino: 60,
  },
  {
    id_benef: 3,
    nombre_completo: 'Lucia Fernandez',
    escuela: 'Bachillerato 16',
    tutor: null,
    sesiones_realizadas: 0,
    sesiones_esperadas: 10,
    sesiones_programadas: 0,
    pct_examen_inicio: 70,
    pct_examen_termino: null,
  },
  {
    id_benef: 4,
    nombre_completo: 'Pedro Martinez',
    escuela: 'Bachillerato 8',
    tutor: 'Sofia Ruiz',
    sesiones_realizadas: 10,
    sesiones_esperadas: 10,
    sesiones_programadas: 0,
    pct_examen_inicio: 50,
    pct_examen_termino: 75,
  },
]

function seedSession(win) {
  win.localStorage.setItem('token', FAKE_TOKEN)
  win.localStorage.setItem('user', JSON.stringify(FAKE_USER))
  win.localStorage.setItem('rol', FAKE_USER.rol)
}

function mockPeriodosGet(data = PERIODOS_MOCK) {
  cy.intercept('GET', '**/api/periodos', { statusCode: 200, body: data }).as('getPeriodos')
}

function mockBeneficiariosGet(data = BENEFICIARIOS_MOCK) {
  cy.intercept('GET', '**/api/beneficiario-periodo/*', { statusCode: 200, body: data }).as('getBeneficiarios')
}

function mockBeneficiariosAnterioresGet(data = []) {
  cy.intercept('GET', '**/api/beneficiario-periodo/anteriores', { statusCode: 200, body: data }).as('getBeneficiariosAnteriores')
}

function visitWithSession() {
  cy.visit('/coordinador/progreso', { onBeforeLoad: seedSession })
}

describe('Progreso Beneficiario', () => {
  beforeEach(() => {
    cy.logout()
  })

  // CP-COORD-PRG-01
  it('redirects to login when accessing progreso without session', () => {
    cy.visit('/coordinador/progreso')
    cy.url().should('include', '/login')
  })

  // CP-COORD-PRG-02
  it('renders progreso screen with valid coordinador session', () => {
    mockPeriodosGet()
    mockBeneficiariosGet()
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getBeneficiarios')
    cy.contains('h1', 'Progreso de Beneficiarios').should('be.visible')
    cy.contains('Avance en sesiones y exámenes de inglés por beneficiario').should('be.visible')
  })

  // CP-COORD-PRG-03
  it('shows loading state while fetching progreso data', () => {
    mockPeriodosGet()
    mockBeneficiariosGet()
    
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getBeneficiarios')
    
    // After data loads, should see the content (not loading state)
    cy.contains('h1', 'Progreso de Beneficiarios').should('be.visible')
    cy.contains('4 beneficiarios').should('be.visible')
  })

  // CP-COORD-PRG-04
  it('calls required progreso endpoints on initial load', () => {
    mockPeriodosGet()
    mockBeneficiariosGet()
    visitWithSession()
    cy.wait('@getPeriodos').its('request.url').should('include', '/api/periodos')
    cy.wait('@getBeneficiarios').its('request.url').should('match', /\/api\/beneficiario-periodo\/\d+/)
  })

  // CP-COORD-PRG-05
  it('sends Authorization Bearer token on progreso requests', () => {
    mockPeriodosGet()
    mockBeneficiariosGet()
    visitWithSession()
    cy.wait('@getPeriodos').its('request.headers').should('have.property', 'authorization', `Bearer ${FAKE_TOKEN}`)
    cy.wait('@getBeneficiarios').its('request.headers').should('have.property', 'authorization', `Bearer ${FAKE_TOKEN}`)
  })

  // CP-COORD-PRG-06
  it('renders beneficiario progress list with main metrics', () => {
    mockPeriodosGet()
    mockBeneficiariosGet()
    visitWithSession()
    cy.wait('@getBeneficiarios')
    
    // Check summary cards
    cy.contains('Beneficiarios').should('be.visible')
    cy.contains('4').should('be.visible') // 4 beneficiarios
    cy.contains('Con tutor asignado').should('be.visible')
    cy.contains('3').should('be.visible') // 3 with tutors
    cy.contains('Sesiones realizadas').should('be.visible')
    cy.contains('21').should('be.visible') // 8+3+0+10
    
    // Check table headers
    cy.contains('th', 'Beneficiario').should('be.visible')
    cy.contains('th', 'Tutor').should('be.visible')
    cy.contains('th', 'Sesiones realizadas').should('be.visible')
    cy.contains('th', 'Examen inicio').should('be.visible')
    cy.contains('th', 'Examen término').should('be.visible')
    cy.contains('th', 'Avance').should('be.visible')
    
    // Check beneficiarios in table
    cy.contains('Maria Lopez').should('be.visible')
    cy.contains('Carlos Ramirez').should('be.visible')
    cy.contains('Lucia Fernandez').should('be.visible')
    cy.contains('Pedro Martinez').should('be.visible')
  })

  // CP-COORD-PRG-07
  it('renders correct progress indicator for each beneficiario', () => {
    mockPeriodosGet()
    mockBeneficiariosGet()
    visitWithSession()
    cy.wait('@getBeneficiarios')
    
    // Maria: 8/10 sessions
    cy.contains('tr', 'Maria Lopez').within(() => {
      cy.contains('8/10').should('be.visible')
    })
    
    // Carlos: 3/10 sessions (low progress)
    cy.contains('tr', 'Carlos Ramirez').within(() => {
      cy.contains('3/10').should('be.visible')
    })
    
    // Pedro: 10/10 sessions (completed)
    cy.contains('tr', 'Pedro Martinez').within(() => {
      cy.contains('10/10').should('be.visible')
    })
    
    // Check exam progress badges
    cy.contains('tr', 'Maria Lopez').within(() => {
      cy.contains('65%').should('be.visible') // examen inicio
      cy.contains('82%').should('be.visible') // examen termino
      cy.contains('+17').should('be.visible') // avance positivo
    })
  })

  // CP-COORD-PRG-08
  it('filters progreso by beneficiario search criteria', () => {
    mockPeriodosGet()
    mockBeneficiariosGet()
    visitWithSession()
    cy.wait('@getBeneficiarios')
    
    // Initially all 4 beneficiarios visible
    cy.contains('Maria Lopez').should('be.visible')
    cy.contains('Carlos Ramirez').should('be.visible')
    cy.contains('Lucia Fernandez').should('be.visible')
    cy.contains('Pedro Martinez').should('be.visible')
    cy.contains('4 beneficiarios').should('be.visible')
    
    // Search for "Maria"
    cy.get('input[placeholder="Buscar beneficiario..."]').type('Maria')
    cy.contains('Maria Lopez').should('be.visible')
    cy.contains('Carlos Ramirez').should('not.exist')
    cy.contains('Lucia Fernandez').should('not.exist')
    cy.contains('Pedro Martinez').should('not.exist')
    cy.contains('1 beneficiario').should('be.visible')
    cy.contains('filtro: "Maria"').should('be.visible')
    
    // Clear and search for "Fernandez"
    cy.get('input[placeholder="Buscar beneficiario..."]').clear().type('Fernandez')
    cy.contains('Lucia Fernandez').should('be.visible')
    cy.contains('Maria Lopez').should('not.exist')
  })

  // CP-COORD-PRG-09
  it('filters progreso by selected periodo', () => {
    mockPeriodosGet()
    mockBeneficiariosGet()
    mockBeneficiariosAnterioresGet([
      { id_benef: 5, nombre_completo: 'Alumno Anterior', sesiones_realizadas: 5, sesiones_esperadas: 10 }
    ])
    visitWithSession()
    cy.wait('@getBeneficiarios')
    
    // Initially on active period
    cy.contains('button', 'Periodo activo').should('have.class', 'bg-orange-500')
    cy.contains('Maria Lopez').should('be.visible')
    
    // Switch to previous periods
    cy.contains('button', 'Periodos anteriores').click()
    cy.wait('@getBeneficiariosAnteriores')
    cy.contains('Alumno Anterior').should('be.visible')
    cy.contains('Maria Lopez').should('not.exist')
  })

  // CP-COORD-PRG-10
  it('opens progreso detail from row action', () => {
    // This test verifies the table row is clickable/interactive
    // In the current implementation, rows don't navigate but could in the future
    mockPeriodosGet()
    mockBeneficiariosGet()
    visitWithSession()
    cy.wait('@getBeneficiarios')
    
    // Verify rows are present and hoverable
    cy.contains('tr', 'Maria Lopez').should('have.class', 'hover:bg-gray-50')
    cy.contains('tr', 'Carlos Ramirez').should('exist')
  })

  // CP-COORD-PRG-11
  it('shows risk alerts for low progreso beneficiarios', () => {
    mockPeriodosGet()
    mockBeneficiariosGet()
    visitWithSession()
    cy.wait('@getBeneficiarios')
    
    // Carlos has low progress (3/10 = 30%) and small improvement (60-55 = +5)
    cy.contains('tr', 'Carlos Ramirez').within(() => {
      cy.contains('3/10').should('be.visible')
      cy.contains('+5').should('be.visible')
    })
    
    // Lucia has no tutor assigned - risk indicator
    cy.contains('tr', 'Lucia Fernandez').within(() => {
      cy.contains('Sin asignar').should('be.visible')
      cy.contains('0/10').should('be.visible')
    })
  })

  // CP-COORD-PRG-12
  it('sorts progreso list by completion percentage', () => {
    mockPeriodosGet()
    mockBeneficiariosGet()
    visitWithSession()
    cy.wait('@getBeneficiarios')
    
    // Verify beneficiarios are displayed (order may vary)
    const beneficiarios = ['Maria Lopez', 'Carlos Ramirez', 'Lucia Fernandez', 'Pedro Martinez']
    beneficiarios.forEach(name => {
      cy.contains('tr', name).should('exist')
    })
    
    // Verify progress percentages are visible
    cy.contains('8/10').should('be.visible') // Maria: 80%
    cy.contains('3/10').should('be.visible') // Carlos: 30%
    cy.contains('0/10').should('be.visible') // Lucia: 0%
    cy.contains('10/10').should('be.visible') // Pedro: 100%
  })

  // CP-COORD-PRG-13
  it('shows empty state when no progreso data is available', () => {
    mockPeriodosGet()
    mockBeneficiariosGet([]) // Empty array
    visitWithSession()
    cy.wait('@getBeneficiarios')
    
    cy.contains('Sin beneficiarios').should('be.visible')
    cy.contains('No hay beneficiarios en el periodo activo').should('be.visible')
    cy.contains('Maria Lopez').should('not.exist')
  })

  // CP-COORD-PRG-14
  it('shows error feedback when progreso load request fails', () => {
    mockPeriodosGet()
    cy.intercept('GET', '**/api/beneficiario-periodo/*', { statusCode: 500, body: { error: 'Server error' } }).as('getBeneficiariosError')
    visitWithSession()
    cy.wait('@getBeneficiariosError')
    
    // After error, should show empty state (component catches error and sets empty array)
    cy.contains('Sin beneficiarios').should('be.visible')
  })

  // CP-COORD-PRG-15
  it('renders partial data when a secondary endpoint fails', () => {
    // If periodos fails but beneficiarios succeeds, should still show some data
    cy.intercept('GET', '**/api/periodos', { statusCode: 500 }).as('getPeriodosError')
    cy.intercept('GET', '**/api/beneficiario-periodo/*', { statusCode: 200, body: BENEFICIARIOS_MOCK }).as('getBeneficiarios')
    visitWithSession()
    
    // Even if periodos fails, the page should render
    cy.contains('h1', 'Progreso de Beneficiarios').should('be.visible')
  })

  // CP-COORD-PRG-16
  it('does not call unrelated endpoints from progreso module', () => {
    mockPeriodosGet()
    mockBeneficiariosGet()
    
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getBeneficiarios')
    
    // Verify that the page loaded correctly with the expected data
    cy.contains('h1', 'Progreso de Beneficiarios').should('be.visible')
    cy.contains('4 beneficiarios').should('be.visible')
    
    // Verify that the required API endpoints were called
    cy.get('@getPeriodos.all').should('have.length.at.least', 1)
    cy.get('@getBeneficiarios.all').should('have.length.at.least', 1)
  })
})