const FAKE_TOKEN = 'fake-coord-token'
const FAKE_USER = {
  id_usuario: 99,
  nombre_completo: 'Coordinadora Prueba',
  email: 'coord@test.com',
  rol: 'coordinador',
}

const POSTULACIONES_MOCK = [
  {
    id_postulacion: 101,
    nombre_completo: 'Ana Perez',
    email: 'ana@test.com',
    matricula: 'A001',
    carrera: 'Ingenieria en Sistemas',
    semestre: 6,
    fecha_postulacion: '2026-05-20T10:00:00.000Z',
    estado: 'pendiente',
    por_que_escogerte: 'Porque tengo experiencia dando asesorias.',
    por_que_interesa: 'Quiero ayudar a otros estudiantes.',
    link_video: 'https://youtube.com/watch?v=test123',
    captura_duolingo: '/uploads/duolingo-ana.png',
  },
  {
    id_postulacion: 102,
    nombre_completo: 'Luis Gomez',
    email: 'luis@test.com',
    matricula: 'A002',
    carrera: 'Ingenieria Industrial',
    semestre: 7,
    fecha_postulacion: '2026-05-18T10:00:00.000Z',
    estado: 'aceptado',
    por_que_escogerte: 'Participo en mentorias.',
    por_que_interesa: 'Me interesa fortalecer liderazgo.',
    link_video: '',
    captura_duolingo: null,
  },
  {
    id_postulacion: 103,
    nombre_completo: 'Maria Ruiz',
    email: 'maria@test.com',
    matricula: 'A003',
    carrera: 'Ingenieria Civil',
    semestre: 8,
    fecha_postulacion: '2026-05-16T10:00:00.000Z',
    estado: 'rechazado',
    por_que_escogerte: 'Tengo buenas habilidades de comunicacion.',
    por_que_interesa: 'Quiero compartir conocimiento.',
    link_video: 'https://youtube.com/watch?v=test456',
    captura_duolingo: '/uploads/duolingo-maria.png',
  },
]

function seedSession(win) {
  win.localStorage.setItem('token', FAKE_TOKEN)
  win.localStorage.setItem('user', JSON.stringify(FAKE_USER))
  win.localStorage.setItem('rol', FAKE_USER.rol)
}

function mockPostulacionesGet(handler) {
  cy.intercept('GET', 'http://localhost:3000/api/postulaciones*', handler).as('getPostulaciones')
}

function visitWithSession() {
  cy.visit('/coordinador/postulaciones', {
    onBeforeLoad(win) {
      seedSession(win)
    },
  })
}

function waitInitialGet() {
  cy.wait('@getPostulaciones')
}

function clickVerDetalleByName(nombre) {
  cy.contains('td', nombre)
    .parents('tr')
    .within(() => {
      cy.get('button').first().click()
    })
}

function closeModal() {
  cy.contains('h2', 'Detalle de postulación')
    .closest('div[class*="fixed"]')
    .find('button')
    .contains('Cerrar')
    .click()
}

describe('Postulaciones', () => {
  beforeEach(() => {
    cy.logout()
  })

  // CP-COORD-POST-01
  it('redirects to login when accessing postulaciones without session', () => {
    cy.visit('/coordinador/postulaciones')

    cy.url().should('include', '/login')
  })

  // CP-COORD-POST-02
  it('renders postulaciones screen with valid coordinador session', () => {
    mockPostulacionesGet({ statusCode: 200, body: POSTULACIONES_MOCK })
    visitWithSession()
    waitInitialGet()

    cy.contains('Postulaciones').should('be.visible')
    cy.contains('Revisa y gestiona las postulaciones del periodo activo').should('be.visible')
    cy.contains('Filtrar por estado:').should('be.visible')
    cy.contains('Todos').should('be.visible')
    cy.contains('Pendiente').should('be.visible')
    cy.contains('Aceptado').should('be.visible')
    cy.contains('Rechazado').should('be.visible')
  })

  // CP-COORD-POST-03
  it('shows loading state while fetching postulaciones', () => {
    mockPostulacionesGet({ statusCode: 200, delay: 900, body: POSTULACIONES_MOCK })
    visitWithSession()

    cy.get('.animate-spin').should('exist')
    waitInitialGet()
    cy.get('.animate-spin').should('not.exist')
  })

  // CP-COORD-POST-04
  it('calls GET /postulaciones on initial load', () => {
    mockPostulacionesGet({ statusCode: 200, body: POSTULACIONES_MOCK })
    visitWithSession()
    waitInitialGet()

    cy.get('@getPostulaciones.all').then((calls) => {
      expect(calls.length).to.be.at.least(1)
    })
  })

  // CP-COORD-POST-05
  it('sends Authorization Bearer token on postulaciones requests', () => {
    const expectedHeader = `Bearer ${FAKE_TOKEN}`

    mockPostulacionesGet((req) => {
      expect(req.headers.authorization).to.eq(expectedHeader)
      req.reply({ statusCode: 200, body: POSTULACIONES_MOCK })
    })

    visitWithSession()
    waitInitialGet()
  })

  // CP-COORD-POST-06
  it('renders main postulaciones table columns and rows', () => {
    mockPostulacionesGet({ statusCode: 200, body: POSTULACIONES_MOCK })
    visitWithSession()
    waitInitialGet()

    cy.contains('th', 'Nombre').should('be.visible')
    cy.contains('th', 'Correo').should('be.visible')
    cy.contains('th', 'Matrícula').should('be.visible')
    cy.contains('th', 'Carrera').should('be.visible')
    cy.contains('th', 'Semestre').should('be.visible')
    cy.contains('th', 'Fecha').should('be.visible')
    cy.contains('th', 'Estado').should('be.visible')

    cy.contains('Ana Perez').should('be.visible')
    cy.contains('Luis Gomez').should('be.visible')
    cy.contains('Maria Ruiz').should('be.visible')
  })

  // CP-COORD-POST-07
  it('renders correct badge and label for each postulacion status', () => {
    mockPostulacionesGet({ statusCode: 200, body: POSTULACIONES_MOCK })
    visitWithSession()
    waitInitialGet()

    cy.contains('Pendiente').should('be.visible')
    cy.contains('Aceptado').should('be.visible')
    cy.contains('Rechazado').should('be.visible')
  })

  // CP-COORD-POST-08
  it('shows empty state when no postulaciones are available', () => {
    mockPostulacionesGet({ statusCode: 200, body: [] })
    visitWithSession()
    waitInitialGet()

    cy.contains('No hay postulaciones para este periodo').should('be.visible')
  })

  // CP-COORD-POST-09
  it('filters postulaciones by estado pendiente', () => {
    mockPostulacionesGet((req) => {
      if (req.url.includes('estado=pendiente')) {
        req.reply({ statusCode: 200, body: POSTULACIONES_MOCK.filter((p) => p.estado === 'pendiente') })
        return
      }
      req.reply({ statusCode: 200, body: POSTULACIONES_MOCK })
    })

    visitWithSession()
    waitInitialGet()

    cy.contains('button', 'Pendiente').click()
    cy.wait('@getPostulaciones')
    cy.get('@getPostulaciones.all').then((calls) => {
      const hasEstadoParam = calls.some((call) => call.request.url.includes('estado=pendiente'))
      expect(hasEstadoParam).to.be.true
    })
    cy.contains('Ana Perez').should('be.visible')
    cy.contains('Luis Gomez').should('not.exist')
    cy.contains('Maria Ruiz').should('not.exist')
  })

  // CP-COORD-POST-10
  it('filters postulaciones by estado aceptado', () => {
    mockPostulacionesGet((req) => {
      if (req.url.includes('estado=aceptado')) {
        req.reply({ statusCode: 200, body: POSTULACIONES_MOCK.filter((p) => p.estado === 'aceptado') })
        return
      }
      req.reply({ statusCode: 200, body: POSTULACIONES_MOCK })
    })

    visitWithSession()
    waitInitialGet()

    cy.contains('button', 'Aceptado').click()
    cy.wait('@getPostulaciones')
    cy.get('@getPostulaciones.all').then((calls) => {
      const hasEstadoParam = calls.some((call) => call.request.url.includes('estado=aceptado'))
      expect(hasEstadoParam).to.be.true
    })
    cy.contains('Luis Gomez').should('be.visible')
    cy.contains('Ana Perez').should('not.exist')
    cy.contains('Maria Ruiz').should('not.exist')
  })

  // CP-COORD-POST-11
  it('filters postulaciones by estado rechazado', () => {
    mockPostulacionesGet((req) => {
      if (req.url.includes('estado=rechazado')) {
        req.reply({ statusCode: 200, body: POSTULACIONES_MOCK.filter((p) => p.estado === 'rechazado') })
        return
      }
      req.reply({ statusCode: 200, body: POSTULACIONES_MOCK })
    })

    visitWithSession()
    waitInitialGet()

    cy.contains('button', 'Rechazado').click()
    cy.wait('@getPostulaciones')
    cy.get('@getPostulaciones.all').then((calls) => {
      const hasEstadoParam = calls.some((call) => call.request.url.includes('estado=rechazado'))
      expect(hasEstadoParam).to.be.true
    })
    cy.contains('Maria Ruiz').should('be.visible')
    cy.contains('Ana Perez').should('not.exist')
    cy.contains('Luis Gomez').should('not.exist')
  })

  // CP-COORD-POST-12
  it('resets filter when selecting Todos', () => {
    mockPostulacionesGet((req) => {
      if (req.url.includes('estado=pendiente')) {
        req.reply({ statusCode: 200, body: POSTULACIONES_MOCK.filter((p) => p.estado === 'pendiente') })
        return
      }
      req.reply({ statusCode: 200, body: POSTULACIONES_MOCK })
    })

    visitWithSession()
    waitInitialGet()

    cy.contains('button', 'Pendiente').click()
    cy.wait('@getPostulaciones')
    cy.get('@getPostulaciones.all').then((calls) => {
      const hasEstadoParam = calls.some((call) => call.request.url.includes('estado=pendiente'))
      expect(hasEstadoParam).to.be.true
    })

    cy.contains('button', 'Todos').click()
    cy.wait('@getPostulaciones')
    // Verify at least one recent call doesn't have estado param
    cy.get('@getPostulaciones.all').then((calls) => {
      const lastCall = calls[calls.length - 1]
      expect(lastCall.request.url).to.not.include('estado=')
    })
    cy.contains('Ana Perez').should('be.visible')
    cy.contains('Luis Gomez').should('be.visible')
    cy.contains('Maria Ruiz').should('be.visible')
  })

  // CP-COORD-POST-13
  it('opens detail modal from row action', () => {
    mockPostulacionesGet({ statusCode: 200, body: POSTULACIONES_MOCK })
    visitWithSession()
    waitInitialGet()

    clickVerDetalleByName('Ana Perez')

    cy.contains('Detalle de postulación').should('be.visible')
    cy.contains('Datos personales').should('be.visible')
    cy.contains('Preguntas de postulación').should('be.visible')
    cy.contains('Ana Perez').should('be.visible')
    cy.contains('Ver video en YouTube').should('be.visible')
    cy.get('img[alt="Captura Duolingo"]').should('exist')
  })

  // CP-COORD-POST-14
  it('closes detail modal without state changes', () => {
    mockPostulacionesGet({ statusCode: 200, body: POSTULACIONES_MOCK })
    visitWithSession()
    waitInitialGet()

    clickVerDetalleByName('Ana Perez')
    cy.contains('Detalle de postulación').should('be.visible')

    closeModal()
    cy.contains('Detalle de postulación').should('not.exist')
    cy.contains('Ana Perez').should('be.visible')
  })

  // CP-COORD-POST-15
  it('shows accept/reject actions for pendiente postulacion', () => {
    mockPostulacionesGet({ statusCode: 200, body: POSTULACIONES_MOCK })
    visitWithSession()
    waitInitialGet()

    clickVerDetalleByName('Ana Perez')

    cy.contains('button', 'Rechazar').should('be.visible')
    cy.contains('button', 'Aceptar').should('be.visible')
    cy.contains('button', 'Aceptar de todas formas').should('not.exist')
  })

  // CP-COORD-POST-16
  it('shows only allowed actions for non-pendiente postulacion', () => {
    mockPostulacionesGet({ statusCode: 200, body: POSTULACIONES_MOCK })
    visitWithSession()
    waitInitialGet()

    clickVerDetalleByName('Luis Gomez')
    cy.contains('Detalle de postulación').should('be.visible')
    cy.contains('h2', 'Detalle de postulación').closest('div[class*="fixed"]').within(() => {
      cy.contains('button', /^Rechazar$/).should('not.exist')
      cy.contains('button', /^Aceptar$/).should('not.exist')
      cy.contains('button', 'Cerrar').should('be.visible')
      cy.contains('button', 'Aceptar de todas formas').should('not.exist')
    })

    closeModal()
    clickVerDetalleByName('Maria Ruiz')
    cy.contains('Detalle de postulación').should('be.visible')
    cy.contains('h2', 'Detalle de postulación').closest('div[class*="fixed"]').within(() => {
      cy.contains('button', /^Rechazar$/).should('not.exist')
      cy.contains('button', /^Aceptar$/).should('not.exist')
      cy.contains('button', 'Aceptar de todas formas').should('be.visible')
    })
  })

  // CP-COORD-POST-17
  it('accepts postulacion successfully and refreshes list', () => {
    let callCount = 0

    mockPostulacionesGet((req) => {
      callCount++
      // After PATCH is called, return updated data
      if (callCount > 2) {
        const updated = POSTULACIONES_MOCK.map((item) =>
          item.id_postulacion === 101 ? { ...item, estado: 'aceptado' } : item,
        )
        req.reply({ statusCode: 200, body: updated })
      } else {
        req.reply({ statusCode: 200, body: POSTULACIONES_MOCK })
      }
    })
    cy.intercept('PATCH', 'http://localhost:3000/api/postulaciones/101/aceptar', {
      statusCode: 200,
      body: { ok: true },
    }).as('aceptarPostulacion')

    visitWithSession()
    waitInitialGet()
    clickVerDetalleByName('Ana Perez')

    cy.contains('h2', 'Detalle de postulación').closest('div[class*="fixed"]').contains('button', 'Aceptar').click()

    cy.wait('@aceptarPostulacion')
    cy.wait('@getPostulaciones')
    cy.contains('Postulación aceptada').should('be.visible')
    cy.contains('Detalle de postulación').should('not.exist')

    cy.contains('td', 'Ana Perez').parents('tr').within(() => {
      cy.contains('Aceptado').should('be.visible')
    })
  })

  // CP-COORD-POST-18
  it('rejects postulacion successfully and refreshes list', () => {
    let callCount = 0

    mockPostulacionesGet((req) => {
      callCount++
      // After PATCH is called, return updated data
      if (callCount > 2) {
        const updated = POSTULACIONES_MOCK.map((item) =>
          item.id_postulacion === 101 ? { ...item, estado: 'rechazado' } : item,
        )
        req.reply({ statusCode: 200, body: updated })
      } else {
        req.reply({ statusCode: 200, body: POSTULACIONES_MOCK })
      }
    })
    cy.intercept('PATCH', 'http://localhost:3000/api/postulaciones/101/rechazar', {
      statusCode: 200,
      body: { ok: true },
    }).as('rechazarPostulacion')

    visitWithSession()
    waitInitialGet()
    clickVerDetalleByName('Ana Perez')

    cy.contains('h2', 'Detalle de postulación').closest('div[class*="fixed"]').contains('button', 'Rechazar').click()

    cy.wait('@rechazarPostulacion')
    cy.wait('@getPostulaciones')
    cy.contains('Postulación rechazada').should('be.visible')
    cy.contains('Detalle de postulación').should('not.exist')

    cy.contains('td', 'Ana Perez').parents('tr').within(() => {
      cy.contains('Rechazado').should('be.visible')
    })
  })

  // CP-COORD-POST-19
  it('shows error feedback when accept/reject request fails', () => {
    mockPostulacionesGet({ statusCode: 200, body: POSTULACIONES_MOCK })
    cy.intercept('PATCH', 'http://localhost:3000/api/postulaciones/101/aceptar', {
      statusCode: 500,
      body: { error: 'Fallo servidor' },
    }).as('aceptarPostulacionError')

    visitWithSession()
    waitInitialGet()
    clickVerDetalleByName('Ana Perez')
    cy.contains('h2', 'Detalle de postulación').closest('div[class*="fixed"]').contains('button', 'Aceptar').click()

    cy.wait('@aceptarPostulacionError')
    cy.contains('Fallo servidor').should('be.visible')
    cy.contains('Detalle de postulación').should('be.visible')
  })

  // CP-COORD-POST-20
  it('does not call unrelated endpoints from postulaciones module', () => {
    mockPostulacionesGet({ statusCode: 200, body: POSTULACIONES_MOCK })
    cy.intercept('POST', 'http://localhost:3000/api/auth/login').as('loginRequest')
    cy.intercept('POST', 'http://localhost:3000/api/auth/register').as('registerRequest')
    cy.intercept('GET', 'http://localhost:3000/api/sesiones*').as('sesionesRequest')
    cy.intercept('GET', 'http://localhost:3000/api/bitacoras*').as('bitacorasRequest')

    visitWithSession()
    waitInitialGet()
    cy.contains('button', 'Pendiente').click()
    cy.wait('@getPostulaciones')
    clickVerDetalleByName('Ana Perez')
    closeModal()

    cy.get('@loginRequest.all').should('have.length', 0)
    cy.get('@registerRequest.all').should('have.length', 0)
    cy.get('@sesionesRequest.all').should('have.length', 0)
    cy.get('@bitacorasRequest.all').should('have.length', 0)
  })
})