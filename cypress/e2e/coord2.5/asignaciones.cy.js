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

const USUARIOS_MOCK = [
  // Tutores
  { id: 10, id_tutor: 100, nombre_completo: 'Juan Perez', email: 'juan@test.com', rol: 'tutor', carrera: 'Ing. Sistemas', semestre: 6, id_periodo: 1, id_revisor: null },
  { id: 11, id_tutor: 101, nombre_completo: 'Maria Lopez', email: 'maria@test.com', rol: 'tutor', carrera: 'Ing. Industrial', semestre: 7, id_periodo: 1, id_revisor: 200 },
  
  // Beneficiarios
  { id: 20, nombre_completo: 'Carlos Ruiz', email: 'carlos@test.com', rol: 'beneficiario', escuela: 'Prepa 16', grado_escolar: 3, id_periodo: 1, id_tutor: null },
  { id: 21, nombre_completo: 'Ana Garcia', email: 'ana@test.com', rol: 'beneficiario', escuela: 'Prepa 9', grado_escolar: 2, id_periodo: 1, id_tutor: 100 },
  
  // Revisores
  { id: 30, id_revisor: 200, nombre_completo: 'Pedro Sanchez', email: 'pedro@test.com', rol: 'revisor', carrera: 'Ing. Civil', semestre: 8, id_periodo: 1 },
]

function seedSession(win) {
  win.localStorage.setItem('token', FAKE_TOKEN)
  win.localStorage.setItem('user', JSON.stringify(FAKE_USER))
  win.localStorage.setItem('rol', FAKE_USER.rol)
}

function mockPeriodosGet(handler) {
  cy.intercept('GET', 'http://localhost:3000/api/periodos*', handler).as('getPeriodos')
}

function mockUsuariosGet(handler) {
  cy.intercept('GET', 'http://localhost:3000/api/usuarios*', handler).as('getUsuarios')
}

function mockUsuariosPut(id, handler) {
  cy.intercept('PUT', `http://localhost:3000/api/usuarios/${id}`, handler).as('putUsuarios')
}

function mockAsignarAutomatico(handler) {
  cy.intercept('POST', 'http://localhost:3000/api/usuarios/asignar-automatico', handler).as('postAsignarAuto')
}

function visitWithSession() {
  cy.visit('/coordinador/asignaciones', { onBeforeLoad: seedSession })
}

describe('Asignaciones', () => {
  beforeEach(() => {
    cy.logout()
  })

  // CP-COORD-ASG-01
  it('redirects to login when accessing asignaciones without session', () => {
    cy.visit('/coordinador/asignaciones')
    cy.url().should('include', '/login')
  })

  // CP-COORD-ASG-02
  it('renders asignaciones screen with valid coordinador session', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.contains('h1', 'Asignaciones').should('be.visible')
    cy.contains('Asigna tutores a beneficiarios y revisores a tutores por periodo').should('be.visible')
  })

  // CP-COORD-ASG-03
  it('shows loading state while fetching asignaciones data', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK, delay: 500 })
    visitWithSession()
    cy.wait('@getPeriodos')
    
    // Select periodo to trigger usuarios load
    cy.get('select').first().select('1')
    
    // Should show spinner while loading
    cy.get('[class*="animate-spin"]').should('exist')
  })

  // CP-COORD-ASG-04
  it('calls required endpoints on initial load', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    visitWithSession()
    
    // Should call periodos first
    cy.wait('@getPeriodos').its('request.url').should('include', '/api/periodos')
    
    // Should call usuarios after selecting periodo
    cy.wait('@getUsuarios').its('request.url').should('include', '/api/usuarios')
  })

  // CP-COORD-ASG-05
  it('sends Authorization Bearer token on asignaciones requests', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    visitWithSession()
    
    cy.wait('@getPeriodos').its('request.headers').should('have.property', 'authorization', `Bearer ${FAKE_TOKEN}`)
    cy.wait('@getUsuarios').its('request.headers').should('have.property', 'authorization', `Bearer ${FAKE_TOKEN}`)
  })

  // CP-COORD-ASG-06
  it('renders asignaciones list with tutor, beneficiario, periodo and estado', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getUsuarios')
    
    // Check periodo selector
    cy.contains('Enero-Mayo 2026').should('exist')
    
    // Check tutores section
    cy.contains('Tutores (2)').should('be.visible')
    cy.contains('Juan Perez').should('exist')
    cy.contains('Maria Lopez').should('exist')
    
    // Check beneficiarios section
    cy.contains('Beneficiarios (2)').should('be.visible')
    cy.contains('Carlos Ruiz').should('exist')
    cy.contains('Ana Garcia').should('exist')
    
    // Check revisores section - scroll to see it
    cy.contains('Revisores a tutores').scrollIntoView()
    cy.contains('Revisores (1)').should('be.visible')
    cy.contains('Pedro Sanchez').should('exist')
  })

  // CP-COORD-ASG-07
  it('shows empty state when no asignaciones are available', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: [] })
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getUsuarios')
    
    // Should show empty messages (check existence instead of visibility due to overflow)
    cy.contains('No hay tutores en este periodo').should('exist')
    cy.contains('No hay beneficiarios en este periodo').should('exist')
    
    // Scroll to see revisores section
    cy.contains('Revisores a tutores').scrollIntoView()
    cy.contains('No hay revisores en este periodo').should('exist')
  })

  // CP-COORD-ASG-08 - Adapted: no modal, but select tutors from dropdown
  it('shows tutor assignment selectors for beneficiarios', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getUsuarios')
    
    // Find beneficiario card and check for select element
    cy.contains('Carlos Ruiz').parents('li').within(() => {
      cy.get('select').should('exist')
      cy.get('select option').should('contain', 'Sin tutor asignado')
      cy.get('select option').should('contain', 'Juan Perez')
    })
  })

  // CP-COORD-ASG-09 - Adapted: validation happens at API level, not form level
  it('allows selecting tutor for beneficiario', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getUsuarios')
    
    // Check that select has options
    cy.contains('Carlos Ruiz').parents('li').within(() => {
      cy.get('select').should('have.value', '')
      cy.get('select option').should('have.length.greaterThan', 1)
    })
  })

  // CP-COORD-ASG-10
  it('updates beneficiario assignment successfully', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getUsuarios')
    
    // Setup intercept for PUT request
    cy.intercept('PUT', 'http://localhost:3000/api/usuarios/20', {
      statusCode: 200,
      body: { id: 20, id_tutor: 100 }
    }).as('putUsuario')
    
    // Setup refresh call
    const updatedMock = [...USUARIOS_MOCK]
    updatedMock[2] = { ...updatedMock[2], id_tutor: 100 }
    cy.intercept('GET', 'http://localhost:3000/api/usuarios*', {
      statusCode: 200,
      body: updatedMock
    }).as('getUsuariosRefresh')
    
    // Select tutor for Carlos
    cy.contains('Carlos Ruiz').parents('li').within(() => {
      cy.get('select').select('100')
    })
    
    cy.wait('@putUsuario')
    cy.contains('Asignación actualizada').should('be.visible')
    cy.wait('@getUsuariosRefresh')
  })

  // CP-COORD-ASG-11 - Adapted: conflict would come from API
  it('handles error when assignment fails', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getUsuarios')
    
    // Setup intercept for failed PUT request
    cy.intercept('PUT', 'http://localhost:3000/api/usuarios/20', {
      statusCode: 400,
      body: { error: 'Error al asignar' }
    }).as('putUsuarioError')
    
    // Try to select tutor
    cy.contains('Carlos Ruiz').parents('li').within(() => {
      cy.get('select').select('100')
    })
    
    cy.wait('@putUsuarioError')
    cy.contains('Error al asignar').should('be.visible')
  })

  // CP-COORD-ASG-12 - Adapted: check revisor assignment selectors
  it('shows revisor assignment selectors for tutores', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getUsuarios')
    
    // Scroll to revisores section
    cy.contains('Revisores a tutores').scrollIntoView()
    
    // Find the second Tutores section (after Revisores section)
    // There are two sections with tutores: first under "Tutores a beneficiarios", second under "Revisores a tutores"
    cy.contains('Revisores a tutores').parent().within(() => {
      cy.contains('Juan Perez').should('exist')
      cy.contains('Sin revisor asignado').should('exist')
    })
  })

  // CP-COORD-ASG-13
  it('updates tutor revisor assignment successfully', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getUsuarios')
    
    // Setup intercept for PUT request
    cy.intercept('PUT', 'http://localhost:3000/api/usuarios/10', {
      statusCode: 200,
      body: { id: 10, id_revisor: 200 }
    }).as('putUsuario')
    
    const updatedMock = [...USUARIOS_MOCK]
    updatedMock[0] = { ...updatedMock[0], id_revisor: 200 }
    cy.intercept('GET', 'http://localhost:3000/api/usuarios*', {
      statusCode: 200,
      body: updatedMock
    }).as('getUsuariosRefresh')
    
    // Scroll to revisores section and wait for it to be visible
    cy.contains('Revisores a tutores').scrollIntoView().should('be.visible')
    cy.wait(200) // Small wait to ensure page has scrolled
    
    // Find select with "Sin revisor asignado" (Juan's default value)
    cy.contains('option', 'Sin revisor asignado').parent('select').select('200')
    
    cy.wait('@putUsuario')
    cy.contains('Asignación actualizada').should('be.visible')
    cy.wait('@getUsuariosRefresh')
  })

  // CP-COORD-ASG-14
  it('triggers automatic assignment of beneficiarios to tutores', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getUsuarios')
    
    // Setup intercept for auto assignment
    cy.intercept('POST', 'http://localhost:3000/api/usuarios/asignar-automatico', {
      statusCode: 200,
      body: { asignados: 1 }
    }).as('postAsignarAuto')
    
    cy.intercept('GET', 'http://localhost:3000/api/usuarios*', {
      statusCode: 200,
      body: USUARIOS_MOCK
    }).as('getUsuariosRefresh')
    
    // Click automatic assignment button
    cy.contains('button', 'Asignar automáticamente').first().click()
    
    cy.wait('@postAsignarAuto')
    cy.contains('asignado').should('be.visible')
    cy.wait('@getUsuariosRefresh')
  })

  // CP-COORD-ASG-15
  it('filters asignaciones by selected periodo', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getUsuarios')
    
    // Setup intercept for empty response when changing periodo
    cy.intercept('GET', 'http://localhost:3000/api/usuarios*', {
      statusCode: 200,
      body: []
    }).as('getUsuariosEmpty')
    
    // Change to periodo 2
    cy.get('select').first().select('2')
    
    cy.wait('@getUsuariosEmpty')
    // Should show empty state for periodo 2
    cy.contains('No hay tutores en este periodo').should('exist')
  })

  // CP-COORD-ASG-16
  it('does not trigger unrelated endpoint calls', () => {
    mockPeriodosGet({ statusCode: 200, body: PERIODOS_MOCK })
    mockUsuariosGet({ statusCode: 200, body: USUARIOS_MOCK })
    
    // Setup intercepts for unrelated endpoints
    cy.intercept('POST', 'http://localhost:3000/api/auth/login').as('loginCall')
    cy.intercept('GET', 'http://localhost:3000/api/postulaciones*').as('postulacionesCall')
    cy.intercept('GET', 'http://localhost:3000/api/horas*').as('horasCall')
    
    visitWithSession()
    cy.wait('@getPeriodos')
    cy.wait('@getUsuarios')
    
    // Verify no unrelated calls
    cy.get('@loginCall.all').should('have.length', 0)
    cy.get('@postulacionesCall.all').should('have.length', 0)
    cy.get('@horasCall.all').should('have.length', 0)
  })
})