describe('Postulacion', () => {
  const fillPostulacionForm = ({
    nombre = 'Tutor Postulante',
    email = 'postulante@test.com',
    matricula = 'A01234567',
    semestre = '6',
    carrera = 'Ingenieria en Sistemas',
    porQueEscogerte = 'Tengo experiencia dando asesoria academica y comunicacion efectiva.',
    porQueInteresa = 'Me interesa apoyar a estudiantes y desarrollar habilidades de mentor.',
    linkVideo = 'https://youtube.com/watch?v=abc123xyz00',
  } = {}) => {
    cy.get('input[placeholder="Juan Pérez García"]').clear().type(nombre)
    cy.get('input[type="email"]').clear().type(email)
    cy.get('input[placeholder="A01234567"]').clear().type(matricula)
    cy.get('input[type="number"]').clear().type(semestre)
    cy.get('input[placeholder="Ingeniería en Sistemas Computacionales"]').clear().type(carrera)
    cy.get('textarea[placeholder*="Describe tus habilidades"]').clear().type(porQueEscogerte)
    cy.get('textarea[placeholder*="Comparte tu motivación"]').clear().type(porQueInteresa)

    if (linkVideo !== undefined) {
      cy.get('input[placeholder="https://youtube.com/watch?v=..."]').clear()
      if (linkVideo) cy.get('input[placeholder="https://youtube.com/watch?v=..."]').type(linkVideo)
    }
  }

  const submitPostulacion = () => {
    cy.contains('button[type="submit"]', 'Enviar postulación').scrollIntoView().click()
  }

  const getMultipartBody = (req) => {
    if (req.body && typeof req.body.get === 'function') return req.body
    if (typeof req.body === 'string') return req.body
    if (req.body instanceof ArrayBuffer) return new TextDecoder().decode(req.body)
    return JSON.stringify(req.body)
  }

  beforeEach(() => {
    cy.logout()
    cy.visit('/postulacion')
  })

  //CP-AUTH-46
  it('Render of postulacion page', () => {
    cy.contains('Postulación para Tutor').should('exist')
    cy.get('input[placeholder="Juan Pérez García"]').should('exist')
    cy.get('input[type="email"]').should('exist')
    cy.get('input[placeholder="A01234567"]').should('exist')
    cy.get('input[type="number"]').should('exist')
    cy.get('input[placeholder="Ingeniería en Sistemas Computacionales"]').should('exist')
    cy.get('textarea[placeholder*="Describe tus habilidades"]').should('exist')
    cy.get('textarea[placeholder*="Comparte tu motivación"]').should('exist')
    cy.get('input[type="file"]').should('exist')
    cy.get('input[placeholder="https://youtube.com/watch?v=..."]').should('exist')
    cy.contains('button[type="submit"]', 'Enviar postulación').scrollIntoView().should('be.visible')
  })

  //CP-AUTH-47
  it('Navigation to login when clicking "Iniciar sesión"', () => {
    cy.contains('Inicia sesión').click()
    cy.url().should('include', '/login')
  })

  //CP-AUTH-48
  it('Empty required fields show validations and do not call API', () => {
    cy.intercept('POST', /\/api\/postulaciones/).as('createPostulacion')

    submitPostulacion()

    cy.contains('Obligatorio').should('exist')
    cy.get('@createPostulacion.all').should('have.length', 0)
  })

  //CP-AUTH-49
  it('Invalid email shows validation and does not call API', () => {
    cy.intercept('POST', /\/api\/postulaciones/).as('createPostulacion')

    fillPostulacionForm({ email: 'invalid@email' })
    submitPostulacion()

    cy.contains('Correo inválido').should('exist')
    cy.get('@createPostulacion.all').should('have.length', 0)
  })

  //CP-AUTH-50
  it('Semester min validation blocks submit', () => {
    cy.intercept('POST', /\/api\/postulaciones/).as('createPostulacion')

    fillPostulacionForm({ semestre: '0' })
    submitPostulacion()

    cy.contains('Mín. 1').should('exist')
    cy.get('@createPostulacion.all').should('have.length', 0)
  })

  //CP-AUTH-51
  it('Semester max validation blocks submit', () => {
    cy.intercept('POST', /\/api\/postulaciones/).as('createPostulacion')

    fillPostulacionForm({ semestre: '13' })
    submitPostulacion()

    cy.contains('Máx. 12').should('exist')
    cy.get('@createPostulacion.all').should('have.length', 0)
  })

  //CP-AUTH-52
  it('Open question min-length validations block submit', () => {
    cy.intercept('POST', /\/api\/postulaciones/).as('createPostulacion')

    fillPostulacionForm({ porQueEscogerte: 'texto corto', porQueInteresa: 'texto corto' })
    submitPostulacion()

    cy.contains('Mínimo 30 caracteres').should('exist')
    cy.get('@createPostulacion.all').should('have.length', 0)
  })

  //CP-AUTH-53
  it('Invalid YouTube link shows validation and does not call API', () => {
    cy.intercept('POST', /\/api\/postulaciones/).as('createPostulacion')

    fillPostulacionForm({ linkVideo: 'https://vimeo.com/12345' })
    submitPostulacion()

    cy.contains('Debe ser un link válido de YouTube').should('exist')
    cy.get('@createPostulacion.all').should('have.length', 0)
  })

  //CP-AUTH-54
  it('Allows successful submit without optional video link', () => {
    cy.intercept('POST', /\/api\/postulaciones/, { statusCode: 201, body: { ok: true } }).as('createPostulacion')

    fillPostulacionForm({ linkVideo: '' })
    submitPostulacion()

    cy.wait('@createPostulacion')
    cy.contains('¡Postulación enviada!').should('be.visible')
  })

  //CP-AUTH-55
  it('Shows image preview when selecting a file and allows removing it', () => {
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('fake-image-content'),
        fileName: 'duolingo.png',
        mimeType: 'image/png',
        lastModified: Date.now(),
      },
      { force: true }
    )

    cy.get('img[alt="Preview"]').should('exist')
    cy.contains('Quitar imagen').click()
    cy.get('img[alt="Preview"]').should('not.exist')
  })

  //CP-AUTH-56
  it('Successful postulacion shows confirmation state and hides form', () => {
    cy.intercept('POST', /\/api\/postulaciones/, { statusCode: 201, body: { ok: true } }).as('createPostulacion')

    fillPostulacionForm()
    submitPostulacion()

    cy.wait('@createPostulacion')
    cy.contains('¡Postulación enviada!').should('be.visible')
    cy.contains('El coordinador revisará tu postulación').should('be.visible')
    cy.contains('button[type="submit"]', 'Enviar postulación').should('not.exist')
  })

  //CP-AUTH-57
  it('Submit button is disabled while request is loading', () => {
    cy.intercept('POST', /\/api\/postulaciones/, (req) => {
      req.reply({ statusCode: 201, body: { ok: true }, delay: 1200 })
    }).as('createPostulacion')

    fillPostulacionForm()
    submitPostulacion()

    cy.contains('button[type="submit"]', 'Enviar postulación').should('be.disabled')
    cy.wait('@createPostulacion')
  })

  //CP-AUTH-58
  it('Handles backend 409 error and stays on form', () => {
    cy.intercept('POST', /\/api\/postulaciones/, {
      statusCode: 409,
      body: { error: 'Ya existe una postulación para este correo' },
    }).as('createPostulacion')

    fillPostulacionForm()
    submitPostulacion()

    cy.wait('@createPostulacion')
    cy.contains('Ya existe una postulación para este correo').should('exist')
    cy.contains('button[type="submit"]', 'Enviar postulación').should('exist')
  })

  //CP-AUTH-59
  it('Handles backend 500 error and allows retry state', () => {
    cy.intercept('POST', /\/api\/postulaciones/, {
      statusCode: 500,
      body: { error: 'Error interno del servidor' },
    }).as('createPostulacion')

    fillPostulacionForm({ email: 'retry@test.com' })
    submitPostulacion()

    cy.wait('@createPostulacion')
    cy.contains('Error interno del servidor').should('exist')
    cy.contains('button[type="submit"]', 'Enviar postulación').should('exist')
    cy.contains('¡Postulación enviada!').should('not.exist')
  })

  //CP-AUTH-60
  it('Disables submit after first click to avoid repeated manual submit', () => {
    cy.intercept('POST', /\/api\/postulaciones/, (req) => {
      req.reply({ statusCode: 201, body: { ok: true }, delay: 800 })
    }).as('createPostulacion')

    fillPostulacionForm({ email: 'doubleclick@test.com' })
    cy.contains('button[type="submit"]', 'Enviar postulación').scrollIntoView().click()
    cy.contains('button[type="submit"]', 'Enviar postulación').should('be.disabled')

    cy.wait('@createPostulacion')
    cy.get('@createPostulacion.all').should('have.length', 1)
  })

  //CP-AUTH-61
  it('Sends expected required payload fields in multipart request', () => {
    cy.intercept('POST', /\/api\/postulaciones/, (req) => {
      const body = getMultipartBody(req)

      if (body && typeof body.get === 'function') {
        expect(body.get('nombre_completo')).to.equal('Tutor Payload')
        expect(body.get('email')).to.equal('payload@test.com')
        expect(body.get('matricula')).to.equal('A09999999')
        expect(body.get('carrera')).to.equal('ITC')
        expect(body.get('semestre')).to.equal('7')
        expect(body.get('por_que_escogerte')).to.include('experiencia')
        expect(body.get('por_que_interesa')).to.include('apoyar')
      } else {
        expect(body).to.include('name="nombre_completo"')
        expect(body).to.include('Tutor Payload')
        expect(body).to.include('name="email"')
        expect(body).to.include('payload@test.com')
        expect(body).to.include('name="matricula"')
        expect(body).to.include('A09999999')
        expect(body).to.include('name="carrera"')
        expect(body).to.include('ITC')
        expect(body).to.include('name="semestre"')
        expect(body).to.include('7')
      }

      req.reply({ statusCode: 201, body: { ok: true } })
    }).as('createPostulacion')

    fillPostulacionForm({
      nombre: 'Tutor Payload',
      email: 'payload@test.com',
      matricula: 'A09999999',
      semestre: '7',
      carrera: 'ITC',
      porQueEscogerte: 'Tengo experiencia apoyando estudiantes en matematicas y lenguaje.',
      porQueInteresa: 'Me interesa apoyar el desarrollo academico y humano de otros alumnos.',
      linkVideo: '',
    })
    submitPostulacion()

    cy.wait('@createPostulacion')
    cy.contains('¡Postulación enviada!').should('be.visible')
  })

  //CP-AUTH-62
  it('Optional fields are conditionally sent and invalid endpoints are not called', () => {
    cy.intercept('POST', /\/api\/auth\/login/).as('loginCall')
    cy.intercept('POST', /\/api\/auth\/register/).as('registerCall')
    cy.intercept('PATCH', /\/api\/postulaciones\/\d+\/aceptar/).as('aceptarCall')
    cy.intercept('PATCH', /\/api\/postulaciones\/\d+\/rechazar/).as('rechazarCall')

    cy.intercept('POST', /\/api\/postulaciones/, (req) => {
      const body = getMultipartBody(req)

      if (body && typeof body.get === 'function') {
        expect(body.get('link_video')).to.equal('https://youtube.com/watch?v=xyz987abc11')
        expect(body.get('captura_duolingo')).to.not.equal(null)
        expect(body.get('rol')).to.equal(null)
        expect(body.get('password')).to.equal(null)
        expect(body.get('confirmPassword')).to.equal(null)
      } else {
        expect(body).to.include('name="link_video"')
        expect(body).to.include('xyz987abc11')
        expect(body).to.include('name="captura_duolingo"')
        expect(body).to.not.include('name="rol"')
        expect(body).to.not.include('name="password"')
        expect(body).to.not.include('name="confirmPassword"')
      }

      req.reply({ statusCode: 201, body: { ok: true } })
    }).as('createPostulacion')

    fillPostulacionForm({
      nombre: 'Tutor Optional',
      email: 'optional@test.com',
      linkVideo: 'https://youtube.com/watch?v=xyz987abc11',
    })

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('fake-image-content-2'),
        fileName: 'duolingo.webp',
        mimeType: 'image/webp',
        lastModified: Date.now(),
      },
      { force: true }
    )

    submitPostulacion()

    cy.wait('@createPostulacion')
    cy.get('@loginCall.all').should('have.length', 0)
    cy.get('@registerCall.all').should('have.length', 0)
    cy.get('@aceptarCall.all').should('have.length', 0)
    cy.get('@rechazarCall.all').should('have.length', 0)
  })
})