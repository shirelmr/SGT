const FAKE_TOKEN = 'fake-tutor-token'
const FAKE_USER = {
  id_usuario: 1,
  nombre_completo: 'Test User',
  email: 'test_sgt_001@example.com',
  rol: 'tutor',
}

const PERIODOS_MOCK = [
  { id_periodo: 1, nombre: 'Semestre 2026-1', activo: true, horas_esperadas: 50, horas_max: 180 },
  { id_periodo: 2, nombre: 'Semestre 2025-2', activo: false, horas_esperadas: 50, horas_max: 180 },
]

const HORAS_MOCK = [
  {
    id: 1,
    horas_impartidas: 25,
    porcentaje_acred: 50,
    periodo_activo: true,
    periodo: { nombre: 'Semestre 2026-1', horas_esperadas: 50 },
  },
  {
    id: 2,
    horas_impartidas: 45,
    porcentaje_acred: 90,
    periodo_activo: false,
    periodo: { nombre: 'Semestre 2025-2', horas_esperadas: 50 },
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

describe('Mis Horas (tutor)', () => {
  // CP-TUTOR-33
  it('renderiza el header y los datos del período activo', () => {
    cy.intercept('GET', '/api/horas-acreditadas', { statusCode: 200, body: HORAS_MOCK }).as('getHoras')
    cy.intercept('GET', '/api/periodos', { statusCode: 200, body: PERIODOS_MOCK }).as('getPeriodos')

    visitWithSession('/tutor/horas')
    cy.wait('@getHoras')

    cy.contains('Mis Horas').should('be.visible')
    cy.contains('Consulta tus horas impartidas y acreditadas').should('be.visible')
  })

  // CP-TUTOR-34
  it('muestra las 3 cards del período activo con sus labels', () => {
    cy.intercept('GET', '/api/horas-acreditadas', { statusCode: 200, body: HORAS_MOCK }).as('getHoras')
    cy.intercept('GET', '/api/periodos', { statusCode: 200, body: PERIODOS_MOCK }).as('getPeriodos')

    visitWithSession('/tutor/horas')
    cy.wait('@getHoras')

    cy.contains('Horas impartidas').should('be.visible')
    cy.contains('Porcentaje acreditado').should('be.visible')
    cy.contains('Horas acreditadas').should('be.visible')
    cy.contains('25').should('be.visible')
  })

  // CP-TUTOR-35
  it('renderiza la tabla "Historial por periodo" con filas de los períodos', () => {
    cy.intercept('GET', '/api/horas-acreditadas', { statusCode: 200, body: HORAS_MOCK }).as('getHoras')
    cy.intercept('GET', '/api/periodos', { statusCode: 200, body: PERIODOS_MOCK }).as('getPeriodos')

    visitWithSession('/tutor/horas')
    cy.wait('@getHoras')

    cy.contains('Historial por periodo').should('be.visible')
    cy.contains('Periodo').should('be.visible')
    cy.contains('Horas Impartidas').should('be.visible')
    cy.contains('Horas Esperadas').should('be.visible')
    cy.contains('Porcentaje').should('be.visible')
    cy.contains('Horas Acreditadas').should('be.visible')
    cy.contains('Semestre 2026-1').should('be.visible')
    cy.contains('Semestre 2025-2').should('be.visible')
  })

  // CP-TUTOR-36
  it('muestra el mensaje "No hay historial de horas" cuando el backend devuelve un arreglo vacío', () => {
    cy.intercept('GET', '/api/horas-acreditadas', { statusCode: 200, body: [] }).as('getHorasVacias')
    cy.intercept('GET', '/api/periodos', { statusCode: 200, body: PERIODOS_MOCK }).as('getPeriodos')

    visitWithSession('/tutor/horas')
    cy.wait('@getHorasVacias')

    cy.contains('Historial por periodo').should('be.visible')
    cy.contains('No hay historial de horas').should('be.visible')
  })

  // CP-TUTOR-37
  it('redirige a /login si se accede sin autenticación', () => {
    cy.logout()
    cy.visit('/tutor/horas')
    cy.url().should('include', '/login')
  })
})
