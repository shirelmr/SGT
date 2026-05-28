const FAKE_TOKEN = 'fake-tutor-token'
const FAKE_USER = {
  id_usuario: 1,
  nombre_completo: 'Test User',
  email: 'test_sgt_001@example.com',
  rol: 'tutor',
}

const BENEFICIARIOS_MOCK = [
  {
    id_benef: 10,
    nombre_completo: 'Ana Oviedo',
    escuela: 'Secundaria Técnica 5',
    grado_escolar: '2do grado',
    email: 'ana@test.com',
    sesiones: { total: 1, realizadas: 0, proxima: null, ultima: null },
  },
  {
    id_benef: 11,
    nombre_completo: 'Luis Hernández',
    escuela: 'Primaria Benito Juárez',
    grado_escolar: '5to grado',
    email: 'luis@test.com',
    sesiones: { total: 0, realizadas: 0, proxima: null, ultima: null },
  },
]

function visitWithSession(path) {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', FAKE_TOKEN)
      win.localStorage.setItem('user', JSON.stringify(FAKE_USER))
      win.localStorage.setItem('rol', FAKE_USER.rol)
    },
  })
}

describe('Nueva Sesión (tutor)', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/tutor/mis-beneficiarios', { statusCode: 200, body: BENEFICIARIOS_MOCK }).as('getBeneficiarios')
  })

  // CP-TUTOR-22
  it('renderiza el formulario con la lista de beneficiarios y los campos básicos', () => {
    visitWithSession('/tutor/sesiones/nueva')
    cy.wait('@getBeneficiarios')
    cy.contains('Nueva Sesión').should('be.visible')
    cy.contains('Ana Oviedo').should('be.visible')
    cy.contains('Luis Hernández').should('be.visible')
    cy.get('input[type="date"]').should('be.visible')
    cy.get('input[type="time"]').should('be.visible')
    cy.get('input[type="number"]').should('be.visible')
    cy.contains('Tema').should('be.visible')
    cy.contains('Crear sesión').should('be.visible')
  })

  // CP-TUTOR-23
  it('crea una sesión exitosamente al enviar el formulario con un beneficiario', () => {
    cy.intercept('POST', '/api/sesiones', {
      statusCode: 201,
      body: { id: 999, mensaje: 'creada' },
    }).as('postSesion')
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: [] }).as('getSesionesList')

    visitWithSession('/tutor/sesiones/nueva')
    cy.wait('@getBeneficiarios')

    cy.contains('label', 'Ana Oviedo').find('input[type="checkbox"]').check()
    cy.get('input[type="date"]').type('2026-06-15')
    cy.get('input[type="time"]').type('10:00')
    cy.get('input[type="number"]').clear().type('1.5')
    cy.get('input[placeholder*="Verb to be"]').type('Sesión de prueba')
    cy.contains('button', 'Crear sesión').click()

    cy.wait('@postSesion').its('request.body').should((body) => {
      expect(body).to.have.property('ids_beneficiarios')
      expect(body.ids_beneficiarios).to.include(10)
      expect(body.tema).to.eq('Sesión de prueba')
    })
    cy.url().should('include', '/tutor/sesiones')
  })

  // CP-TUTOR-24
  it('muestra toast de error si se intenta enviar sin seleccionar beneficiario', () => {
    cy.intercept('POST', '/api/sesiones', cy.spy().as('postSesionSpy'))

    visitWithSession('/tutor/sesiones/nueva')
    cy.wait('@getBeneficiarios')

    cy.get('input[type="date"]').type('2026-06-15')
    cy.get('input[type="time"]').type('10:00')
    cy.get('input[type="number"]').clear().type('1')
    cy.get('input[placeholder*="Verb to be"]').type('Sin beneficiario')
    cy.contains('button', 'Crear sesión').click()

    cy.contains('Selecciona al menos un beneficiario').should('be.visible')
    cy.get('@postSesionSpy.all').should('have.length', 0)
  })

  // CP-TUTOR-25
  it('respeta las validaciones HTML5 required y no envía el formulario vacío', () => {
    cy.intercept('POST', '/api/sesiones', cy.spy().as('postSesionVacioSpy'))

    visitWithSession('/tutor/sesiones/nueva')
    cy.wait('@getBeneficiarios')

    cy.contains('label', 'Ana Oviedo').find('input[type="checkbox"]').check()
    cy.contains('button', 'Crear sesión').click()

    // El POST nunca debe dispararse porque react-hook-form bloquea el submit por required
    cy.get('@postSesionVacioSpy.all').should('have.length', 0)
    cy.url().should('include', '/tutor/sesiones/nueva')
  })

  // CP-TUTOR-26
  it('botón Cancelar navega de regreso a /tutor/sesiones', () => {
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: [] }).as('getSesionesLista')
    visitWithSession('/tutor/sesiones/nueva')
    cy.wait('@getBeneficiarios')
    cy.contains('button', 'Cancelar').click()
    cy.url().should('include', '/tutor/sesiones')
    cy.url().should('not.include', '/nueva')
  })

  // CP-TUTOR-27
  it('redirige a /login si se accede sin autenticación', () => {
    cy.logout()
    cy.visit('/tutor/sesiones/nueva')
    cy.url().should('include', '/login')
  })
})
