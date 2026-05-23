describe('Login', () => {
  beforeEach(() => {
    cy.logout()
    cy.visit('/login')
  })

  //CP-AUTH-01
  it('renders the login page', () => {
    cy.contains('SGT').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').contains('Iniciar sesión').should('be.visible')
    cy.contains('Regístrate').should('be.visible')
  })

  //CP-AUTH-02
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

  //CP-AUTH-03 
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

  //CP-AUTH-04
  it('shows validation errors when submitting empty form', () => {
    cy.get('button[type="submit"]').click()
    cy.contains('obligatorio').should('be.visible')
  })

  //CP-AUTH-05
  it('shows error for invalid email format', () => {
    cy.get('input[type="email"]').type('notanemail')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    cy.contains('Correo inválido').should('be.visible')
  })

  //CP-AUTH-06
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

  it('shows password min-length error', () => {
    cy.get('input[placeholder="Juan Pérez"]').type('Test Persona')
    cy.get('input[type="email"]').type('nuevo@test.com')
    cy.get('select').select('tutor')
    cy.get('input[type="password"]').first().type('abc')
    cy.get('input[type="password"]').last().type('abc')
    cy.get('button[type="submit"]').click()
    cy.contains('Mínimo 6 caracteres').should('be.visible')
  })

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
