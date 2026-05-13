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
    cy.intercept('POST', /\/api\/auth\/login/, {
      statusCode: 401,
      body: { error: 'Credenciales incorrectas' },
    }).as('loginFail')

    cy.fixture('users').then(({ invalid }) => {
      cy.get('input[type="email"]').type(invalid.email)
      cy.get('input[type="password"]').type(invalid.password)
      cy.get('button[type="submit"]').click()
      cy.wait('@loginFail')
      cy.contains('Credenciales').should('be.visible')
    })
  })

  // FIX: uses cy.intercept so it doesn't depend on test_sgt_001@example.com existing in the DB
  it('redirects to dashboard on successful login', () => {
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/login/, {
      statusCode: 200,
      body: {
        token: 'fake-tutor-token',
        user: { id_usuario: 1, nombre_completo: 'Test User', email: 'test_sgt_001@example.com', rol: 'tutor' },
      },
    }).as('loginOk')

    cy.fixture('users').then(({ tutor }) => {
      cy.get('input[type="email"]').type(tutor.email)
      cy.get('input[type="password"]').type(tutor.password)
      cy.get('button[type="submit"]').click()
      cy.wait('@loginOk')
      cy.url().should('include', '/tutor/dashboard')
    })
  })

  it('shows validation errors when submitting empty form', () => {
    cy.get('button[type="submit"]').click()
    cy.contains('obligatorio').should('be.visible')
  })

  // NEW: validates email format client-side (no API call needed)
  it('shows error for invalid email format', () => {
    cy.get('input[type="email"]').type('notanemail')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    cy.contains('Correo inválido').should('be.visible')
  })

  // NEW: verifies coordinador role redirects to the correct dashboard
  it('redirects coordinador to /coordinador/dashboard', () => {
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/login/, {
      statusCode: 200,
      body: {
        token: 'fake-coord-token',
        user: { id_usuario: 99, nombre_completo: 'Coordinador Test', email: 'coord@test.com', rol: 'coordinador' },
      },
    }).as('loginCoord')

    cy.get('input[type="email"]').type('coord@test.com')
    cy.get('input[type="password"]').type('anypassword')
    cy.get('button[type="submit"]').click()
    cy.wait('@loginCoord')
    cy.url().should('include', '/coordinador/dashboard')
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

  // NEW: password field has a minLength of 6 — verify the validation message
  it('shows password min-length error', () => {
    cy.get('input[placeholder="Juan Pérez"]').type('Test Persona')
    cy.get('input[type="email"]').type('nuevo@test.com')
    cy.get('select').select('tutor')
    cy.get('input[type="password"]').first().type('abc')
    cy.get('input[type="password"]').last().type('abc')
    cy.get('button[type="submit"]').click()
    cy.contains('Mínimo 6 caracteres').should('be.visible')
  })

  // NEW: simulates a 409 from the API (duplicate email) and checks the inline error block
  it('shows error when registering with duplicate email', () => {
    cy.intercept('POST', /\/api\/auth\/register/, {
      statusCode: 409,
      body: { error: 'Error al registrarse. Intenta de nuevo.' },
    }).as('registerFail')

    cy.get('input[placeholder="Juan Pérez"]').type('Test Persona')
    cy.get('input[type="email"]').type('existing@test.com')
    cy.get('select').select('tutor')
    cy.get('input[type="password"]').first().type('password123')
    cy.get('input[type="password"]').last().type('password123')
    cy.get('button[type="submit"]').click()
    cy.wait('@registerFail')
    cy.contains('Error al registrarse').should('be.visible')
  })
})
