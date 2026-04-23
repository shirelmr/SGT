describe('Usuarios page', () => {
  beforeEach(() => {
    // Mock the API responses so tests don't depend on real database state
    cy.intercept('GET', '/api/usuarios', {
      statusCode: 200,
      body: [
        { id: 1, nombre_completo: 'Ana García', email: 'ana@test.com', rol: 'tutor' },
        { id: 2, nombre_completo: 'Carlos López', email: 'carlos@test.com', rol: 'beneficiario' },
        { id: 3, nombre_completo: 'María Pérez', email: 'maria@test.com', rol: 'revisor' },
      ],
    }).as('getUsuarios')

    cy.intercept('GET', '/api/periodos', { statusCode: 200, body: [] }).as('getPeriodos')

    // Log in programmatically as coordinador
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-coord-token',
        user: { id_usuario: 99, nombre_completo: 'Coordinador Test', email: 'coord@test.com', rol: 'coordinador' },
      },
    }).as('loginCoord')

    cy.visit('/login')
    cy.get('input[type="email"]').type('coord@test.com')
    cy.get('input[type="password"]').type('anypassword')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/coordinador/dashboard')

    cy.visit('/coordinador/usuarios')
    cy.wait('@getUsuarios')
  })

  it('shows the usuarios table with data', () => {
    cy.contains('Ana García').should('be.visible')
    cy.contains('Carlos López').should('be.visible')
    cy.contains('María Pérez').should('be.visible')
  })

  it('displays the correct role badges', () => {
    cy.contains('Tutor').should('be.visible')
    cy.contains('Beneficiario').should('be.visible')
    cy.contains('Revisor').should('be.visible')
  })

  it('opens the create modal when clicking Nuevo usuario', () => {
    cy.contains('Nuevo usuario').click()
    cy.contains('Nombre completo').should('be.visible')
    cy.contains('Email').should('be.visible')
    cy.contains('Contraseña').should('be.visible')
    cy.contains('Rol').should('be.visible')
  })

  it('closes the modal when clicking Cancelar', () => {
    cy.contains('Nuevo usuario').click()
    cy.contains('Cancelar').click()
    cy.contains('Nombre completo').should('not.exist')
  })

  it('shows role-specific fields when tutor is selected in the create form', () => {
    cy.contains('Nuevo usuario').click()
    cy.get('#user-form select').select('tutor')
    cy.contains('Matrícula').should('be.visible')
    cy.contains('Carrera').should('be.visible')
    cy.contains('Semestre').should('be.visible')
  })
})
