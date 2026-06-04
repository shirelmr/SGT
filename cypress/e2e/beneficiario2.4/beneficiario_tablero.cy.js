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
    confirma_benef: false,
    link_sesion: 'https://zoom.us/test',
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
    estado: 'realizada',
    confirma_benef: true,
    link_sesion: null,
    tutor: { nombre_completo: 'Arístides Nieto Guzmán' },
  },
]

const PROGRESO_MOCK = [
  {
    id_benef_periodo: 1,
    pct_examen_inicio: 60,
    pct_examen_termino: null,
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

describe('Tablero Beneficiario', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: SESIONES_MOCK }).as('getSesiones')
    cy.intercept('GET', '/api/beneficiario-periodo/mi-progreso', { statusCode: 200, body: PROGRESO_MOCK }).as('getProgreso')
    visitWithSession('/beneficiario/dashboard')
    cy.wait('@getSesiones')
  })

  // CP-BENEF-01
  it('renderiza el header con saludo y frase motivacional', () => {
    cy.contains(/Buenos días|Buenas tardes|Buenas noches/).should('be.visible')
    cy.contains('Ana').should('be.visible')
    cy.get('p.text-orange-500').should('be.visible')
  })

  // CP-BENEF-02
  it('muestra las 4 stat cards con sus valores', () => {
    cy.contains('Sesiones Realizadas').should('be.visible')
    cy.contains('Sesiones Programadas').should('be.visible')
    cy.contains('Sesiones Canceladas').should('be.visible')
    cy.contains('Total de Sesiones').should('be.visible')
  })

  // CP-BENEF-03
  it('muestra mensaje cuando no hay próxima sesión programada', () => {
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: [] }).as('getSesionesVacias')
    cy.intercept('GET', '/api/beneficiario-periodo/mi-progreso', { statusCode: 200, body: [] }).as('getProgresoVacio')
    visitWithSession('/beneficiario/dashboard')
    cy.wait('@getSesionesVacias')
    cy.contains('No tienes sesiones programadas próximamente').should('be.visible')
  })

  // CP-BENEF-04
  it('muestra la próxima sesión con tema y tutor', () => {
    cy.contains('Próxima Sesión').should('be.visible')
    cy.contains('Present Perfect').should('be.visible')
    cy.contains('Arístides Nieto Guzmán').should('be.visible')
  })

  // CP-BENEF-05
  it('oculta el link de sesión si el beneficiario no ha confirmado asistencia', () => {
    cy.contains('Unirse a la sesión ahora').should('not.exist')
    cy.contains('El enlace aparecerá aquí una vez que confirmes tu asistencia').should('be.visible')
  })

  // CP-BENEF-06
  it('muestra el link de sesión después de confirmar asistencia', () => {
    cy.intercept('GET', '/api/sesiones', {
      statusCode: 200,
      body: SESIONES_MOCK.map(s => s.id === 2 ? { ...s, confirma_benef: true } : s),
    }).as('getSesionesConfirmadas')
    visitWithSession('/beneficiario/dashboard')
    cy.wait('@getSesionesConfirmadas')
    cy.contains('Unirse a la sesión ahora').should('be.visible')
  })

  // CP-BENEF-07
  it('botón confirmar asistencia llama al endpoint correcto', () => {
    cy.intercept('POST', '/api/asistencias/2/confirmar', {
      statusCode: 200,
      body: { id_sesion: 2, confirma_benef: true },
    }).as('confirmar')
    cy.contains('Confirmar Asistencia').click()
    cy.wait('@confirmar')
    cy.contains('Asistencia confirmada').should('be.visible')
  })

  // CP-BENEF-08
  it('botón cancelar asistencia aparece después de confirmar', () => {
    cy.intercept('GET', '/api/sesiones', {
      statusCode: 200,
      body: SESIONES_MOCK.map(s => s.id === 2 ? { ...s, confirma_benef: true } : s),
    }).as('getSesionesConfirmadas')
    visitWithSession('/beneficiario/dashboard')
    cy.wait('@getSesionesConfirmadas')
    cy.contains('Cancelar').should('be.visible')
    cy.contains('Asistencia Confirmada').should('be.visible')
  })

  // CP-BENEF-09
  it('muestra el calendario de sesiones', () => {
    cy.contains('Calendario de Sesiones').should('be.visible')
    const mesActual = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    cy.contains(new RegExp(mesActual, 'i')).should('be.visible')
  })

  // CP-BENEF-10
  it('muestra el historial reciente de sesiones', () => {
    cy.contains('Historial Reciente').should('exist')
    cy.contains('Verbos irregulares').should('exist')
    cy.contains('Verbo To Be').should('exist')
  })

  // CP-BENEF-11
  it('redirige a login si accede sin autenticación', () => {
    cy.logout()
    cy.visit('/beneficiario/dashboard')
    cy.url().should('include', '/login')
  })
})