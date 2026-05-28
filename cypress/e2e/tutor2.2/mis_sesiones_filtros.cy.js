const FAKE_TOKEN = 'fake-tutor-token'
const FAKE_USER = {
  id_usuario: 1,
  nombre_completo: 'Test User',
  email: 'test_sgt_001@example.com',
  rol: 'tutor',
}

const SESIONES_MOCK = [
  {
    id: 201,
    id_tutor: 1,
    id_beneficiario: 2,
    id_periodo: 1,
    fecha: '2026-05-10T00:00:00.000Z',
    hora_inicio: '10:00',
    duracion_hrs: 2,
    tema: 'Álgebra lineal',
    estado: 'realizada',
    tutor: { nombre_completo: 'Test User' },
    beneficiario: { nombre_completo: 'Ana Beneficiaria' },
    periodo: { nombre: 'Semestre 2026-1', activo: true },
    bitacora: { id_bitacora: 5, estado: 'aprobado' },
  },
  {
    id: 202,
    id_tutor: 1,
    id_beneficiario: 3,
    id_periodo: 1,
    fecha: '2026-05-15T00:00:00.000Z',
    hora_inicio: '12:00',
    duracion_hrs: 1,
    tema: 'Cálculo diferencial',
    estado: 'programada',
    tutor: { nombre_completo: 'Test User' },
    beneficiario: { nombre_completo: 'Luis Beneficiario' },
    periodo: { nombre: 'Semestre 2026-1', activo: true },
    bitacora: null,
  },
  {
    id: 203,
    id_tutor: 1,
    id_beneficiario: 4,
    id_periodo: 2,
    fecha: '2025-11-12T00:00:00.000Z',
    hora_inicio: '09:00',
    duracion_hrs: 1.5,
    tema: 'Estadística histórica',
    estado: 'realizada',
    tutor: { nombre_completo: 'Test User' },
    beneficiario: { nombre_completo: 'Carla Beneficiaria' },
    periodo: { nombre: 'Semestre 2025-2', activo: false },
    bitacora: { id_bitacora: 8, estado: 'aprobado' },
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

describe('Mis Sesiones — filtros y acordeón (tutor)', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: SESIONES_MOCK }).as('getSesiones')
  })

  // CP-TUTOR-16
  it('filtra la lista en tiempo real al escribir en el input de búsqueda', () => {
    visitWithSession('/tutor/sesiones')
    cy.wait('@getSesiones')
    // Solo el período activo se muestra por default
    cy.contains('Álgebra lineal').should('be.visible')
    cy.contains('Cálculo diferencial').should('be.visible')

    cy.get('input[placeholder*="Buscar"]').type('álgebra')
    cy.contains('Álgebra lineal').should('be.visible')
    cy.contains('Cálculo diferencial').should('not.exist')
  })

  // CP-TUTOR-17
  it('filtra por estado de sesión usando el select correspondiente', () => {
    visitWithSession('/tutor/sesiones')
    cy.wait('@getSesiones')
    cy.get('select').eq(0).select('programada')
    cy.contains('Cálculo diferencial').should('be.visible')
    cy.contains('Álgebra lineal').should('not.exist')
  })

  // CP-TUTOR-18
  it('muestra el botón "Limpiar" cuando hay filtros activos y los resetea al hacer click', () => {
    visitWithSession('/tutor/sesiones')
    cy.wait('@getSesiones')
    cy.contains('Limpiar').should('not.exist')
    cy.get('input[placeholder*="Buscar"]').type('cálculo')
    cy.contains('Limpiar').should('be.visible').click()
    cy.get('input[placeholder*="Buscar"]').should('have.value', '')
    cy.contains('Álgebra lineal').should('be.visible')
    cy.contains('Cálculo diferencial').should('be.visible')
  })

  // CP-TUTOR-19
  it('expande la card de sesión y muestra los tiles de Fecha, Día, Hora y Duración', () => {
    visitWithSession('/tutor/sesiones')
    cy.wait('@getSesiones')
    cy.contains('Álgebra lineal').click()
    cy.contains('Fecha').should('be.visible')
    cy.contains('Día').should('be.visible')
    cy.contains('Hora').should('be.visible')
    cy.contains('Duración').should('be.visible')
    cy.contains('Beneficiario').should('be.visible')
    cy.contains('Ana Beneficiaria').should('be.visible')
  })

  // CP-TUTOR-20
  it('muestra el botón "Ver historial" y agrupa por período al activarse', () => {
    visitWithSession('/tutor/sesiones')
    cy.wait('@getSesiones')
    cy.contains('Estadística histórica').should('not.exist')
    cy.contains(/Ver historial/).should('be.visible').click()
    cy.contains('Semestre 2026-1').should('be.visible')
    cy.contains('Semestre 2025-2').should('be.visible')
    cy.contains('Estadística histórica').should('be.visible')
  })

  // CP-TUTOR-21
  it('redirige a /login si se accede sin autenticación', () => {
    cy.logout()
    cy.visit('/tutor/sesiones')
    cy.url().should('include', '/login')
  })
})
