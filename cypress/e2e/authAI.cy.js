// ─── authAI.cy.js ────────────────────────────────────────────────────────────
// End-to-end tests for the /login and /register pages.
// All API calls are intercepted — no real DB data is touched.
// ─────────────────────────────────────────────────────────────────────────────

describe('Login', () => {
  beforeEach(() => {
    // Start every test unauthenticated and on the login page
    cy.logout()
    cy.visit('/login')
  })

  // 1. Page renders with all expected elements
  it('renders the login page correctly', () => {
    cy.contains('SGT').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').contains('Iniciar sesión').should('be.visible')
    cy.contains('Regístrate').should('be.visible')
  })

  // 2. Server returns 401 → inline error containing "Credenciales" is shown
  it('shows an error message on wrong credentials (401)', () => {
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

  // 3. Successful tutor login (200 + rol:"tutor") → redirect to /tutor/dashboard
  it('redirects tutor to /tutor/dashboard on successful login', () => {
    // Stub any subsequent GET calls so the dashboard can render
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/login/, {
      statusCode: 200,
      body: {
        token: 'fake-tutor-token',
        user: {
          id_usuario: 1,
          nombre_completo: 'Test User',
          email: 'test_sgt_001@example.com',
          rol: 'tutor',
        },
      },
    }).as('loginTutor')

    cy.fixture('users').then(({ tutor }) => {
      cy.get('input[type="email"]').type(tutor.email)
      cy.get('input[type="password"]').type(tutor.password)
      cy.get('button[type="submit"]').click()
      cy.wait('@loginTutor')
      cy.url().should('include', '/tutor/dashboard')
    })
  })

  // 4. Empty form submission → client-side validation message containing "obligatorio"
  it('shows a required-field validation message for an empty form', () => {
    cy.get('button[type="submit"]').click()
    cy.contains('obligatorio').should('be.visible')
  })

  // 5. Malformed email format → client-side validation message "Correo inválido"
  it('shows an invalid-email error for a non-email string', () => {
    cy.get('input[type="email"]').type('notanemail')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    cy.contains('Correo inválido').should('be.visible')
  })

  // 6. Successful coordinador login (200 + rol:"coordinador") → /coordinador/dashboard
  it('redirects coordinador to /coordinador/dashboard on successful login', () => {
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/login/, {
      statusCode: 200,
      body: {
        token: 'fake-coord-token',
        user: {
          id_usuario: 99,
          nombre_completo: 'Coordinador Test',
          email: 'coord@test.com',
          rol: 'coordinador',
        },
      },
    }).as('loginCoord')

    cy.get('input[type="email"]').type('coord@test.com')
    cy.get('input[type="password"]').type('anypassword')
    cy.get('button[type="submit"]').click()
    cy.wait('@loginCoord')
    cy.url().should('include', '/coordinador/dashboard')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('Register', () => {
  beforeEach(() => {
    // Start every test unauthenticated and on the register page
    cy.logout()
    cy.visit('/register')
  })

  // 1. Page renders with all expected elements
  it('renders the register page correctly', () => {
    cy.contains('Crear una cuenta nueva').should('be.visible')
    cy.get('input[placeholder="Juan Pérez"]').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('select').should('be.visible')
    // Two password fields: one for the password and one for confirmation
    cy.get('input[type="password"]').should('have.length', 2)
    cy.contains('Inicia sesión').should('be.visible')
  })

  // 2. Confirmation password differs from password → "no coinciden" error
  it('shows an error when passwords do not match', () => {
    cy.get('input[placeholder="Juan Pérez"]').type('Test Persona')
    cy.get('input[type="email"]').type('nuevo@test.com')
    cy.get('select').select('tutor')
    cy.get('input[type="password"]').first().type('password123')
    cy.get('input[type="password"]').last().type('differentpassword')
    cy.get('button[type="submit"]').click()
    cy.contains('no coinciden').should('be.visible')
  })

  // 3. Empty form submission → client-side validation message containing "obligatorio"
  it('shows a required-field validation message for an empty form', () => {
    cy.get('button[type="submit"]').click()
    cy.contains('obligatorio').should('be.visible')
  })

  // 4. The "Inicia sesión" link navigates back to /login
  it('navigates to /login when clicking the login link', () => {
    cy.contains('Inicia sesión').click()
    cy.url().should('include', '/login')
  })

  // 5. Password shorter than 6 characters → "Mínimo 6 caracteres" error
  it('shows a min-length error when the password is too short', () => {
    cy.get('input[placeholder="Juan Pérez"]').type('Test Persona')
    cy.get('input[type="email"]').type('nuevo@test.com')
    cy.get('select').select('tutor')
    cy.get('input[type="password"]').first().type('abc')
    cy.get('input[type="password"]').last().type('abc')
    cy.get('button[type="submit"]').click()
    cy.contains('Mínimo 6 caracteres').should('be.visible')
  })

  // 6. Server returns 409 (duplicate email) → inline error "Error al registrarse"
  it('shows an error when the email is already registered (409)', () => {
    cy.intercept('POST', /\/api\/auth\/register/, {
      statusCode: 409,
      body: { error: 'Error al registrarse. Intenta de nuevo.' },
    }).as('registerDuplicate')

    cy.get('input[placeholder="Juan Pérez"]').type('Test Persona')
    cy.get('input[type="email"]').type('existing@test.com')
    cy.get('select').select('tutor')
    cy.get('input[type="password"]').first().type('password123')
    cy.get('input[type="password"]').last().type('password123')
    cy.get('button[type="submit"]').click()
    cy.wait('@registerDuplicate')
    cy.contains('Error al registrarse').should('be.visible')
  })
})
