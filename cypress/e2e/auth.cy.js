describe('Login', () => {
  beforeEach(() => {
    cy.logout()
    cy.visit('/login')
  })

  it('renders the login page', () => {
    cy.contains('SGT').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').contains('Iniciar sesión').should('be.visible')
    cy.contains('Regístrate').should('be.visible')
  })

  it('shows an error with wrong credentials', () => {
    cy.fixture('users').then(({ invalid }) => {
      cy.get('input[type="email"]').type(invalid.email)
      cy.get('input[type="password"]').type(invalid.password)
      cy.get('button[type="submit"]').click()
      cy.contains('Credenciales').should('be.visible')
    })
  })

  it('redirects to dashboard on successful login', () => {
    cy.fixture('users').then(({ tutor }) => {
      cy.get('input[type="email"]').type(tutor.email)
      cy.get('input[type="password"]').type(tutor.password)
      cy.get('button[type="submit"]').click()
      cy.url().should('include', '/tutor/dashboard')
    })
  })

  it('shows validation errors when submitting empty form', () => {
    cy.get('button[type="submit"]').click()
    cy.contains('obligatorio').should('be.visible')
  })
})

describe('Register', () => {
  beforeEach(() => {
    cy.logout()
    cy.visit('/register')
  })

  it('renders the register page', () => {
    cy.contains('Crear una cuenta nueva').should('be.visible')
    cy.get('input[placeholder="Juan Pérez"]').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('select').should('be.visible')
    cy.get('input[type="password"]').should('have.length', 2)
    cy.contains('Inicia sesión').should('be.visible')
  })

  it('shows error when passwords do not match', () => {
    cy.get('input[placeholder="Juan Pérez"]').type('Test Persona')
    cy.get('input[type="email"]').type('nuevo@test.com')
    cy.get('select').select('tutor')
    cy.get('input[type="password"]').first().type('password123')
    cy.get('input[type="password"]').last().type('differentpassword')
    cy.get('button[type="submit"]').click()
    cy.contains('no coinciden').should('be.visible')
  })

  it('shows validation errors when submitting empty form', () => {
    cy.get('button[type="submit"]').click()
    cy.contains('obligatorio').should('be.visible')
  })

  it('has a working link back to login', () => {
    cy.contains('Inicia sesión').click()
    cy.url().should('include', '/login')
  })
})
