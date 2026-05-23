describe('Register', () => {
  beforeEach(() => {
    cy.logout()
    cy.visit('/register')
  })

  //CP-AUTH-09
  it('renders the register page', () => {
    cy.contains('Crear cuenta').should('be.visible')
    cy.get('input[placeholder="Juan Pérez"]').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('select').should('be.visible')
    cy.get('input[type="password"]').should('have.length', 2)
    cy.contains('Crear cuenta').should('be.visible')
    cy.contains('Inicia sesión').should('be.visible')
  })

  //CP-AUTH-10
  it('shows error when passwords do not match', () => {
    cy.get('input[placeholder="Juan Pérez"]').type('Test Persona')
    cy.get('input[type="email"]').type('nuevo@test.com')
    cy.get('select').select('beneficiario')
    cy.get('input[type="password"]').first().type('password123')
    cy.get('input[type="password"]').last().type('differentpassword')
    cy.get('button[type="submit"]').click()
    cy.contains('no coinciden').should('be.visible')
  })

  //CP-AUTH-11
  it('shows validation errors when submitting empty form', () => {
    cy.get('button[type="submit"]').click()
    cy.contains('obligatorio').should('be.visible')
  })

  //CP-AUTH-12
  it('has a working link back to login', () => {
    cy.contains('Inicia sesión').click()
    cy.url().should('include', '/login')
  })

  //CP-AUTH-13
  it('shows password min-length error', () => {
    cy.get('input[placeholder="Juan Pérez"]').type('Test Persona')
    cy.get('input[type="email"]').type('nuevo@test.com')
    cy.get('select').select('beneficiario')
    cy.get('input[type="password"]').first().type('abc')
    cy.get('input[type="password"]').last().type('abc')
    cy.get('button[type="submit"]').click()
    cy.contains('Mínimo 6 caracteres').should('be.visible')
  })

  //CP-AUTH-14
  it('shows error when registering with duplicate email', () => {
    cy.intercept('POST', /\/api\/auth\/register/, {
      statusCode: 409,
      body: { error: 'El email ya está registrado' },
    }).as('registerFail')

    cy.get('input[placeholder="Juan Pérez"]').type('Test Persona')
    cy.get('input[type="email"]').type('existing@test.com')
    cy.get('select').select('beneficiario')
    cy.contains('label', 'Grado escolar').parent().find('input').type('Secundaria')
    cy.contains('label', 'Escuela').parent().find('input').type('Escuela Secundaria')
    cy.contains('label', 'Nombre del tutor legal').parent().find('input').type('Tutor Legal')
    cy.contains('label', 'Teléfono del tutor legal').parent().find('input').type('1234567890')
    cy.get('input[type="password"]').first().type('password123')
    cy.get('input[type="password"]').last().type('password123')
    cy.get('button[type="submit"]').click()
    cy.wait('@registerFail')
    cy.contains('El email ya está registrado').should('be.visible')
  })

//CP-AUTH-15
    it('registers a new user successfully (beneficiario)', () => {
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/register/, {
      statusCode: 201,
      body: {
        token: 'fake-benef-token',
        user: {
          id_usuario: 100,
          nombre_completo: 'Test Persona',
          email: 'newuser@test.com',
          rol: 'beneficiario',
        },
      },
    }).as('registerSuccess')

    cy.get('input[placeholder="Juan Pérez"]').type('Test Persona')
    cy.get('input[type="email"]').type('newuser@test.com')
    cy.get('select').select('beneficiario')
    cy.contains('label', 'Grado escolar').parent().find('input').type('Secundaria')
    cy.contains('label', 'Escuela').parent().find('input').type('Escuela Secundaria')
    cy.contains('label', 'Nombre del tutor legal').parent().find('input').type('Tutor Legal')
    cy.contains('label', 'Teléfono del tutor legal').parent().find('input').type('1234567890')
    cy.get('input[type="password"]').first().type('password123')
    cy.get('input[type="password"]').last().type('password123')
    cy.get('button[type="submit"]').click()
    cy.wait('@registerSuccess')
    cy.url().should('include', '/beneficiario/dashboard')
    })

    //CP-AUTH-16
    it('registers a new user successfully (revisor)', () => {
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/register/, {
      statusCode: 201,
      body: {
        token: 'fake-revisor-token',
        user: {
          id_usuario: 100,
          nombre_completo: 'Test Persona',
          email: 'newuser@test.com',
          rol: 'revisor',
        },
      },
    }).as('registerSuccess')

    cy.get('input[placeholder="Juan Pérez"]').type('Test Persona')
    cy.get('input[type="email"]').type('newuser@test.com')
    cy.get('select').select('revisor')
    cy.contains('label', 'Matrícula').parent().find('input').type('A017382456')
    cy.contains('label', 'Carrera').parent().find('input').type('ITC')
    cy.contains('label', 'Semestre').parent().find('input').type('6')
    cy.get('input[type="password"]').first().type('password123')
    cy.get('input[type="password"]').last().type('password123')
    cy.get('button[type="submit"]').click()
    cy.wait('@registerSuccess')
    cy.url().should('include', '/revisor/dashboard')
    })

    //CP-AUTH-17
    it('registers a new user successfully (coordinador)', () => {
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/register/, {
      statusCode: 201,
      body: {
        token: 'fake-coordinador-token',
        user: {
          id_usuario: 100,
          nombre_completo: 'Test Persona',
          email: 'newuser@test.com',
          rol: 'coordinador',
        },
      },
    }).as('registerSuccess')

    cy.get('input[placeholder="Juan Pérez"]').type('Test Persona')
    cy.get('input[type="email"]').type('newuser@test.com')
    cy.get('select').select('coordinador')
    cy.contains('label', 'Departamento').parent().find('input').type('Servicio social')
    cy.get('input[type="password"]').first().type('password123')
    cy.get('input[type="password"]').last().type('password123')
    cy.get('button[type="submit"]').click()
    cy.wait('@registerSuccess')
    cy.url().should('include', '/coordinador/dashboard')
    })
})
