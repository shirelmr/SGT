describe('Register Tutor', () => {
  
  const fillTutorForm = ({
    nombre = 'Test Tutor',
    email = 'tutor.new@test.com',
    matricula = 'A017382456',
    carrera = 'ITC',
    semestre = '6',
    password = 'password123',
    confirmPassword = 'password123',
  } = {}) => {
    cy.get('input[placeholder="Juan Pérez"]').clear().type(nombre)
    cy.get('input[type="email"]').clear().type(email)
    cy.contains('label', 'Matrícula').parent().find('input').clear().type(matricula)
    cy.contains('label', 'Carrera').parent().find('input').clear().type(carrera)
    cy.contains('label', 'Semestre').parent().find('input').clear().type(semestre)
    cy.get('input[type="password"]').first().clear().type(password)
    cy.get('input[type="password"]').last().clear().type(confirmPassword)
  }

  beforeEach(() => {
    cy.logout()
    cy.visit('/register/tutor')
  })
  
  //CP-AUTH-31
  it('Render of register tutor page', () => {
    cy.contains('Registro de Tutor').should('be.visible')
    cy.get('input[placeholder="Juan Pérez"]').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.contains('label', 'Matrícula').parent().find('input').should('be.visible')
    cy.contains('label', 'Carrera').parent().find('input').should('be.visible')
    cy.contains('label', 'Semestre').parent().find('input').should('be.visible')
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().should('be.visible')
  })

  //CP-AUTH-32
  it('Navigation to login when clicking "Iniciar sesión"', () => {
    cy.contains('Inicia sesión').click()
    cy.url().should('include', '/login')
  })

  //CP-AUTH-33
  it('Empty fields validation and messages', () => {
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().click()

    cy.contains('El nombre es obligatorio').should('exist')
    cy.contains('El correo es obligatorio').should('exist')
    cy.contains('La matrícula es obligatoria').should('exist')
    cy.contains('La carrera es obligatoria').should('exist')
    cy.contains('El semestre es obligatorio').should('exist')
    cy.contains('La contraseña es obligatoria').should('exist')
    cy.contains('Confirma tu contraseña').should('exist')
  })

  //CP-AUTH-34
  it('Invalid email format validation and message', () => {
    cy.intercept('POST', /\/api\/auth\/register/).as('registerAttempt')

    fillTutorForm({ email: 'invalid@email' })
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().click()

    cy.contains('Correo inválido').should('exist')
    cy.get('@registerAttempt.all').should('have.length', 0)
  })

  //CP-AUTH-35
  it('Password mismatch validation and message', () => {
    cy.intercept('POST', /\/api\/auth\/register/).as('registerAttempt')

    fillTutorForm({ confirmPassword: 'differentPassword' })
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().click()

    cy.contains('Las contraseñas no coinciden').should('be.visible')
    cy.get('@registerAttempt.all').should('have.length', 0)
  })

  //CP-AUTH-36
  it('Password length validation and message', () => {
    cy.intercept('POST', /\/api\/auth\/register/).as('registerAttempt')

    fillTutorForm({ password: 'abc', confirmPassword: 'abc' })
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().click()

    cy.contains('Mínimo 6 caracteres').should('be.visible')
    cy.get('@registerAttempt.all').should('have.length', 0)
  })

  //CP-AUTH-37
  it('Invalid semester validation and message', () => {
    cy.intercept('POST', /\/api\/auth\/register/).as('registerAttempt')

    fillTutorForm({ semestre: '0' })
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().click()

    cy.contains('Mínimo 1').should('be.visible')
    cy.get('@registerAttempt.all').should('have.length', 0)
  })

  //CP-AUTH-38
  it('Invalid enrollment validation and message', () => {
    cy.intercept('POST', /\/api\/auth\/register/).as('registerAttempt')

    fillTutorForm()
    cy.contains('label', 'Matrícula').parent().find('input').clear()
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().click()

    cy.contains('La matrícula es obligatoria').should('be.visible')
    cy.get('@registerAttempt.all').should('have.length', 0)
  })

  //CP-AUTH-39
  it('Successful registration', () => {
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/register/, {
      statusCode: 201,
      body: {
        token: 'fake-tutor-token',
        user: {
          id_usuario: 101,
          nombre_completo: 'Test Tutor',
          email: 'tutor.new@test.com',
          rol: 'tutor',
        },
      },
    }).as('registerSuccess')

    fillTutorForm()
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().click()

    cy.wait('@registerSuccess')
    cy.url().should('include', '/tutor/dashboard')
  })

  //CP-AUTH-40
  it('Session persistence after registration', () => {
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/register/, {
      statusCode: 201,
      body: {
        token: 'fake-session-token',
        user: {
          id_usuario: 102,
          nombre_completo: 'Tutor Persist',
          email: 'persist@test.com',
          rol: 'tutor',
        },
      },
    }).as('registerSuccess')

    fillTutorForm({ nombre: 'Tutor Persist', email: 'persist@test.com' })
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().click()

    cy.wait('@registerSuccess')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.equal('fake-session-token')
      expect(win.localStorage.getItem('rol')).to.equal('tutor')
    })

    cy.reload()
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.equal('fake-session-token')
      expect(win.localStorage.getItem('rol')).to.equal('tutor')
    })
  })

  //CP-AUTH-41
  it('Duplicate mail validation and message', () => {
    cy.intercept('POST', /\/api\/auth\/register/, {
      statusCode: 409,
      body: { error: 'El email ya está registrado' },
    }).as('registerFail')

    fillTutorForm({ email: 'existing@test.com' })
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().click()

    cy.wait('@registerFail')
    cy.contains('El email ya está registrado').should('be.visible')
    cy.url().should('include', '/register/tutor')
  })

  //CP-AUTH-42
  it('Payload for tutor', () => {
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/register/, (req) => {
      expect(req.body).to.include({
        nombre_completo: 'Tutor Payload',
        email: 'payload@test.com',
        rol: 'tutor',
        matricula: 'A01999999',
        carrera: 'IRS',
        semestre: 8,
        password: 'password123',
      })

      req.reply({
        statusCode: 201,
        body: {
          token: 'payload-token',
          user: {
            id_usuario: 103,
            nombre_completo: 'Tutor Payload',
            email: 'payload@test.com',
            rol: 'tutor',
          },
        },
      })
    }).as('registerSuccess')

    fillTutorForm({
      nombre: 'Tutor Payload',
      email: 'payload@test.com',
      matricula: 'A01999999',
      carrera: 'IRS',
      semestre: '8',
    })
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().click()

    cy.wait('@registerSuccess')
    cy.url().should('include', '/tutor/dashboard')
  })

  //CP-AUTH-43
  it('Clean Payload', () => {
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/register/, (req) => {
      expect(req.body).to.not.have.property('confirmPassword')
      expect(req.body).to.not.have.property('departamento')
      expect(req.body).to.not.have.property('grado_escolar')
      expect(req.body).to.not.have.property('escuela')
      expect(req.body).to.not.have.property('nombre_tutor_legal')
      expect(req.body).to.not.have.property('tel_tutor')

      req.reply({
        statusCode: 201,
        body: {
          token: 'clean-token',
          user: {
            id_usuario: 104,
            nombre_completo: 'Tutor Clean',
            email: 'clean@test.com',
            rol: 'tutor',
          },
        },
      })
    }).as('registerSuccess')

    fillTutorForm({ nombre: 'Tutor Clean', email: 'clean@test.com' })
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().click()

    cy.wait('@registerSuccess')
    cy.url().should('include', '/tutor/dashboard')
  })

  //CP-AUTH-44
  it('Invalid calls with invalid form', () => {
    cy.intercept('POST', /\/api\/auth\/register/).as('registerAttempt')

    fillTutorForm({ confirmPassword: 'differentPassword' })
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().click()

    cy.contains('Las contraseñas no coinciden').should('be.visible')
    cy.get('@registerAttempt.all').should('have.length', 0)
  })

  //CP-AUTH-45
  it('LocalStorage persistence after registration', () => {
    cy.intercept('GET', /\/api\//, { statusCode: 200, body: [] })
    cy.intercept('POST', /\/api\/auth\/register/, {
      statusCode: 201,
      body: {
        token: 'local-token',
        user: {
          id_usuario: 105,
          nombre_completo: 'Tutor LocalStorage',
          email: 'storage@test.com',
          rol: 'tutor',
        },
      },
    }).as('registerSuccess')

    fillTutorForm({ nombre: 'Tutor LocalStorage', email: 'storage@test.com' })
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().click()

    cy.wait('@registerSuccess')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.equal('local-token')
      expect(win.localStorage.getItem('rol')).to.equal('tutor')

      const user = JSON.parse(win.localStorage.getItem('user'))
      expect(user.nombre_completo).to.equal('Tutor LocalStorage')
      expect(user.email).to.equal('storage@test.com')
      expect(user.rol).to.equal('tutor')
    })
  })

})