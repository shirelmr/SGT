describe('Login', () => {
  beforeEach(() => {
    cy.logout()
    cy.visit('/login')
  })

  //CP-AUTH-01
  it('renders the login page', () => {
    cy.contains('TALK!').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').contains('Entrar').should('be.visible')
    cy.contains('Regístrate').should('be.visible')
    cy.contains('¿Quieres ser tutor?').should('be.visible')
  })

  //CP-AUTH-02
  it('shows an error with wrong credentials', () => {
    cy.intercept('POST', /\/api\/auth\/login/, {
      statusCode: 401,
      body: { error: 'Credenciales inválidas' },
    }).as('loginFail')

    cy.fixture('users').then(({ invalid }) => {
      cy.get('input[type="email"]').type(invalid.email)
      cy.get('input[type="password"]').type(invalid.password)
      cy.get('button[type="submit"]').click()
      cy.wait('@loginFail')
      cy.contains('Credenciales inválidas').should('be.visible')
    })
  })

  //CP-AUTH-03 
  it('redirects to dashboard on successful login for role tutor', () => {
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

  //CP-AUTH-07
  it('redirects beneficiario to /beneficiario/dashboard',() => {
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/login/, {
      statusCode: 200,
      body: {
        token: 'fake-benef-token',
        user: { id_usuario: 100, nombre_completo: 'Beneficiario Test', email: 'benef@test.com', rol: 'beneficiario' },
      },
    }).as('loginBenef')

    cy.get('input[type="email"]').type('benef@test.com')
    cy.get('input[type="password"]').type('anypassword')
    cy.get('button[type="submit"]').click()
    cy.wait('@loginBenef')
    cy.url().should('include', '/beneficiario/dashboard')
  })

  //CP-AUTH-08
  it('redirects revisor to /revisor/dashboard',() => {
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/login/, {
      statusCode: 200,
      body: {
        token: 'fake-revisor-token',
        user: { id_usuario: 101, nombre_completo: 'Revisor Test', email: 'revisor@test.com', rol: 'revisor' },
      },
    }).as('loginRevisor')

    cy.get('input[type="email"]').type('revisor@test.com')
    cy.get('input[type="password"]').type('anypassword')
    cy.get('button[type="submit"]').click()
    cy.wait('@loginRevisor')
    cy.url().should('include', '/revisor/dashboard')
  })

//CP-AUTH-09
it('login empty does not do request', () => {
  cy.intercept('POST', /\/api\/auth\/login/).as('loginAttempt')
  cy.get('button[type="submit"]').click()
  cy.contains('obligatorio').should('be.visible')
  cy.get('@loginAttempt.all').should('have.length', 0)
})

//CP-AUTH-10
it('login with invalid mail does not do request', () => {
  cy.intercept('POST', /\/api\/auth\/login/).as('loginAttempt')
  cy.get('input[type="email"]').type('invalidemail')
  cy.get('input[type="password"]').type('anypassword')
  cy.get('button[type="submit"]').click()
  cy.contains('Correo inválido').should('be.visible')
  cy.get('@loginAttempt.all').should('have.length', 0)
})

//CP-AUTH-11
it('successful login and store token and role in localStorage', () => {
  cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
  cy.intercept('POST', /\/api\/auth\/login/, {
    statusCode: 200,
    body: {
      token: 'fake-token',
      user: { id_usuario: 1, nombre_completo: 'Test User', email: 'testuser@test.com', rol: 'tutor' },
    },
  }).as('loginSuccess')
  cy.get('input[type="email"]').type('testuser@test.com')
  cy.get('input[type="password"]').type('anypassword')
  cy.get('button[type="submit"]').click()
  cy.wait('@loginSuccess')
  cy.url().should('include', '/tutor/dashboard')
  cy.window().then((win) => {
    expect(win.localStorage.getItem('token')).to.equal('fake-token')
    expect(win.localStorage.getItem('rol')).to.equal('tutor')
  })
  })

//CP-AUTH-12
it('logout clears session and blocks protected route access', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('token', 'seed-token')
    win.localStorage.setItem('rol', 'tutor')
    win.localStorage.setItem(
      'user',
      JSON.stringify({ id_usuario: 200, nombre_completo: 'Tutor Seed', email: 'seed@test.com', rol: 'tutor' })
    )
  })

  cy.logout()
  cy.window().then((win) => {
    expect(win.localStorage.getItem('token')).to.equal(null)
    expect(win.localStorage.getItem('rol')).to.equal(null)
    expect(win.localStorage.getItem('user')).to.equal(null)
  })

  cy.visit('/tutor/dashboard')
  cy.url().should('include', '/login')
})

//CP-AUTH-13
it('redirects to login when accessing protected route without session', () => {
  cy.logout()
  cy.visit('/tutor/dashboard')
  cy.url().should('include', '/login')
})

//CP-AUTH-14
it('redirects authenticated user from root to role dashboard', () => {
  cy.visit('/', {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', 'guard-token')
      win.localStorage.setItem('rol', 'tutor')
      win.localStorage.setItem(
        'user',
        JSON.stringify({ id_usuario: 201, nombre_completo: 'Tutor Guard', email: 'guard@test.com', rol: 'tutor' })
      )
    },
  })

  cy.url().should('include', '/tutor/dashboard')
})

//CP-AUTH-15
it('shows generic error message on login network error', () => {
  cy.intercept('POST', /\/api\/auth\/login/, { forceNetworkError: true }).as('loginNetworkError')

  cy.get('input[type="email"]').type('network@test.com')
  cy.get('input[type="password"]').type('password123')
  cy.get('button[type="submit"]').click()

  cy.wait('@loginNetworkError')
  cy.contains('Credenciales incorrectas').should('be.visible')
})
})
