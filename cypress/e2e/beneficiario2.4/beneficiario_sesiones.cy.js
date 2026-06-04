const FAKE_TOKEN = 'fake-benef-token'
const FAKE_USER = {
  id_usuario: 100,
  nombre_completo: 'Ana Paola Oviedo',
  email: 'benef@test.com',
  rol: 'beneficiario',
}

const SESIONES_MOCK = [
  {
    id: 1,
    fecha: '2026-05-22T00:00:00.000Z',
    hora_inicio: '10:00',
    tema: 'Verbos irregulares',
    estado: 'realizada',
    confirma_benef: true,
    link_sesion: null,
    tutor: { nombre_completo: 'Arístides Nieto Guzmán' },
  },
  {
    id: 2,
    fecha: '2026-06-10T00:00:00.000Z',
    hora_inicio: '11:00',
    tema: 'Present Perfect',
    estado: 'programada',
    confirma_benef: false,
    link_sesion: 'https://zoom.us/test2',
    tutor: { nombre_completo: 'Arístides Nieto Guzmán' },
  },
  {
    id: 3,
    fecha: '2026-05-13T00:00:00.000Z',
    hora_inicio: '09:00',
    tema: 'Verbo To Be',
    estado: 'cancelada',
    confirma_benef: false,
    link_sesion: null,
    tutor: { nombre_completo: 'Arístides Nieto Guzmán' },
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

describe('Mis Sesiones Beneficiario', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: SESIONES_MOCK }).as('getSesiones')
    visitWithSession('/beneficiario/sesiones')
    cy.wait('@getSesiones')
  })

  // CP-BENEF-12
  it('muestra el historial completo de sesiones', () => {
    cy.contains('Mis Sesiones').should('be.visible')
    cy.contains('Verbos irregulares').should('be.visible')
    cy.contains('Present Perfect').should('be.visible')
    cy.contains('Verbo To Be').should('be.visible')
  })

  // CP-BENEF-13
  it('muestra los badges de estado correctamente', () => {
    cy.contains('realizada').should('be.visible')
    cy.contains('programada').should('be.visible')
    cy.contains('cancelada').should('be.visible')
  })

  // CP-BENEF-14
  it('filtro Programadas muestra solo sesiones programadas', () => {
    cy.contains('Programadas').click()
    cy.contains('Present Perfect').should('be.visible')
    cy.contains('Verbos irregulares').should('not.exist')
    cy.contains('Verbo To Be').should('not.exist')
  })

  // CP-BENEF-15
  it('filtro Realizadas muestra solo sesiones realizadas', () => {
    cy.contains('Realizadas').click()
    cy.contains('Verbos irregulares').should('be.visible')
    cy.contains('Present Perfect').should('not.exist')
    cy.contains('Verbo To Be').should('not.exist')
  })

  // CP-BENEF-16
  it('filtro Canceladas muestra solo sesiones canceladas', () => {
    cy.contains('Canceladas').click()
    cy.contains('Verbo To Be').should('be.visible')
    cy.contains('Verbos irregulares').should('not.exist')
    cy.contains('Present Perfect').should('not.exist')
  })

  // CP-BENEF-17
  it('filtro Todas muestra todas las sesiones', () => {
    cy.contains('Programadas').click()
    cy.contains('Todas').click()
    cy.contains('Verbos irregulares').should('be.visible')
    cy.contains('Present Perfect').should('be.visible')
    cy.contains('Verbo To Be').should('be.visible')
  })

  // CP-BENEF-18
  it('muestra empty state cuando no hay sesiones', () => {
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: [] }).as('getSesionesVacias')
    visitWithSession('/beneficiario/sesiones')
    cy.wait('@getSesionesVacias')
    cy.contains('Sin sesiones').should('be.visible')
  })

  // CP-BENEF-19
  it('muestra empty state al filtrar por estado sin resultados', () => {
    cy.intercept('GET', '/api/sesiones', {
      statusCode: 200,
      body: SESIONES_MOCK.filter(s => s.estado !== 'cancelada'),
    }).as('getSinCanceladas')
    visitWithSession('/beneficiario/sesiones')
    cy.wait('@getSinCanceladas')
    cy.contains('Canceladas').click()
    cy.contains('Sin sesiones').should('be.visible')
  })

  // CP-BENEF-20
  it('no muestra botón de confirmar asistencia en ninguna sesión', () => {
    cy.contains('Confirmar asistencia').should('not.exist')
  })

  // CP-BENEF-21
  it('redirige a login si accede sin autenticación', () => {
    cy.logout()
    cy.visit('/beneficiario/sesiones')
    cy.url().should('include', '/login')
  })
})