const FAKE_TOKEN = 'fake-tutor-token'
const FAKE_USER = {
  id_usuario: 1,
  nombre_completo: 'Test User',
  email: 'test_sgt_001@example.com',
  rol: 'tutor',
}

const PERFIL_MOCK = {
  matricula: 'A01234567',
  semestre: 6,
  carrera: 'Ingeniería en Tecnologías Computacionales',
  link_zoom: 'https://zoom.us/j/123456789',
}

function visitWithSession(path) {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', FAKE_TOKEN)
      win.localStorage.setItem('user', JSON.stringify(FAKE_USER))
      win.localStorage.setItem('rol', FAKE_USER.rol)
    },
  })
}

describe('Mi Perfil (tutor)', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/tutor/perfil', { statusCode: 200, body: PERFIL_MOCK }).as('getPerfil')
  })

  // CP-TUTOR-28
  it('renderiza el header y los datos del tutor traídos del backend', () => {
    visitWithSession('/tutor/perfil')
    cy.wait('@getPerfil')
    cy.contains('Mi Perfil').should('be.visible')
    cy.contains('Datos de tutor').should('be.visible')
    cy.contains('A01234567').should('be.visible')
    cy.contains('6').should('be.visible')
    cy.contains('Ingeniería en Tecnologías Computacionales').should('be.visible')
  })

  // CP-TUTOR-29
  it('muestra los datos de la cuenta (nombre y email) en la sección de solo lectura', () => {
    visitWithSession('/tutor/perfil')
    cy.wait('@getPerfil')
    cy.contains('Cuenta').should('be.visible')
    cy.contains('Test User').should('be.visible')
    cy.contains('test_sgt_001@example.com').should('be.visible')
  })

  // CP-TUTOR-30
  it('el botón "Guardar cambios" arranca deshabilitado y se habilita al modificar el campo', () => {
    visitWithSession('/tutor/perfil')
    cy.wait('@getPerfil')
    cy.contains('button', 'Guardar cambios').should('be.disabled')
    cy.get('input[placeholder*="zoom.us"]').clear().type('https://meet.google.com/abc-defg-hij')
    cy.contains('button', 'Guardar cambios').should('not.be.disabled')
  })

  // CP-TUTOR-31
  it('guarda los cambios exitosamente y muestra el toast "Perfil actualizado"', () => {
    cy.intercept('PUT', '/api/tutor/perfil', { statusCode: 200, body: { ok: true } }).as('updatePerfil')

    visitWithSession('/tutor/perfil')
    cy.wait('@getPerfil')

    cy.get('input[placeholder*="zoom.us"]').clear().type('https://zoom.us/j/987654321')
    cy.contains('button', 'Guardar cambios').click()

    cy.wait('@updatePerfil').its('request.body').should('deep.include', {
      link_zoom: 'https://zoom.us/j/987654321',
    })
    cy.contains('Perfil actualizado').should('be.visible')
  })

  // CP-TUTOR-32
  it('redirige a /login si se accede sin autenticación', () => {
    cy.logout()
    cy.visit('/tutor/perfil')
    cy.url().should('include', '/login')
  })
})
