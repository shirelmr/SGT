const COORD_USER = {
  id_usuario: 99,
  nombre_completo: 'Coordinador Test',
  email: 'coord@test.com',
  rol: 'coordinador',
}

const MOCK_USERS = [
  { id: 1, nombre_completo: 'Ana García', email: 'ana@test.com', rol: 'tutor' },
  { id: 2, nombre_completo: 'Carlos López', email: 'carlos@test.com', rol: 'beneficiario' },
  { id: 3, nombre_completo: 'María Pérez', email: 'maria@test.com', rol: 'revisor' },
]

describe('Usuarios page', () => {
  beforeEach(() => {
    // Use full backend URLs (localhost:3000) so intercepts NEVER match Vite's
    // own module-serving paths at localhost:5173 (e.g. /src/api/axios.js),
    // which would return [] instead of JS and leave the page blank.
    cy.intercept('GET', 'http://localhost:3000/api/**', { statusCode: 200, body: [] })

    // Specific intercepts registered after the catch-all take precedence.
    cy.intercept('GET', 'http://localhost:3000/api/usuarios*', {
      statusCode: 200,
      body: MOCK_USERS,
    }).as('getUsuarios')
    cy.intercept('GET', 'http://localhost:3000/api/periodos*', { statusCode: 200, body: [] }).as('getPeriodos')

    // Set auth in localStorage before React initialises so AuthContext finds
    // the token synchronously and PrivateRoute never redirects to /login.
    cy.visit('/coordinador/usuarios', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'fake-coord-token')
        win.localStorage.setItem('user', JSON.stringify(COORD_USER))
        win.localStorage.setItem('rol', 'coordinador')
      },
    })
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

  it('filters users by name using the search input', () => {
    cy.get('input[placeholder="Buscar por nombre..."]').type('Ana')
    cy.contains('Ana García').should('be.visible')
    cy.contains('Carlos López').should('not.exist')
    cy.contains('María Pérez').should('not.exist')
  })

  it('filters users by role using the role select', () => {
    // Registered last so it takes precedence over the beforeEach alias.
    cy.intercept('GET', 'http://localhost:3000/api/usuarios*', {
      statusCode: 200,
      body: [MOCK_USERS[0]],
    }).as('getByRole')

    cy.get('select').first().select('tutor')
    cy.wait('@getByRole')
    cy.contains('Ana García').should('be.visible')
    cy.contains('Carlos López').should('not.exist')
  })

  it('shows validation errors when submitting empty create form', () => {
    cy.contains('Nuevo usuario').click()
    cy.contains('Crear usuario').click()
    cy.contains('Obligatorio').should('be.visible')
  })

  // Navigate away and back so the fresh intercept returns the empty list.
  it('shows empty state when no users exist', () => {
    cy.intercept('GET', 'http://localhost:3000/api/usuarios*', { statusCode: 200, body: [] }).as('emptyList')
    cy.get('a[href="/coordinador/dashboard"]').click()
    cy.get('a[href="/coordinador/usuarios"]').click()
    cy.wait('@emptyList')
    cy.contains('No hay usuarios registrados').should('be.visible')
  })
})
