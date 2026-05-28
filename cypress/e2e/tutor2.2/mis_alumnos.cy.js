const FAKE_TOKEN = 'fake-tutor-token'
const FAKE_USER = {
  id_usuario: 1,
  nombre_completo: 'Test User',
  email: 'test_sgt_001@example.com',
  rol: 'tutor',
}

const ALUMNOS_MOCK = [
  {
    id_benef: 10,
    nombre_completo: 'Ana Oviedo',
    escuela: 'Secundaria Técnica 5',
    grado_escolar: '2do grado',
    email: 'ana@test.com',
    nombre_tutor_legal: 'María Oviedo',
    tel_tutor: '2221234567',
    examen_inicio: 75,
    fecha_examen_inicio: '2026-03-01T00:00:00.000Z',
    examen_termino: null,
    fecha_examen_termino: null,
    id_benef_periodo: 1,
    id_periodo_activo: 1,
    sesiones: {
      total: 5,
      realizadas: 3,
      proxima: '2026-06-01T00:00:00.000Z',
      ultima: '2026-05-20T00:00:00.000Z',
    },
  },
  {
    id_benef: 11,
    nombre_completo: 'Luis Hernández',
    escuela: 'Primaria Benito Juárez',
    grado_escolar: '5to grado',
    email: 'luis@test.com',
    nombre_tutor_legal: 'Pedro Hernández',
    tel_tutor: '2229876543',
    examen_inicio: null,
    fecha_examen_inicio: null,
    examen_termino: null,
    fecha_examen_termino: null,
    id_benef_periodo: 2,
    id_periodo_activo: 1,
    sesiones: { total: 2, realizadas: 1, proxima: null, ultima: '2026-05-10T00:00:00.000Z' },
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

describe('Mis Alumnos (tutor)', () => {
  // CP-TUTOR-09
  it('renderiza el header con la cantidad correcta de alumnos en el subtítulo', () => {
    cy.intercept('GET', '/api/tutor/mis-beneficiarios', { statusCode: 200, body: ALUMNOS_MOCK }).as('getAlumnos')
    visitWithSession('/tutor/alumnos')
    cy.wait('@getAlumnos')
    cy.contains('Mis Alumnos').should('be.visible')
    cy.contains('2 beneficiarios asignados').should('be.visible')
  })

  // CP-TUTOR-10
  it('lista las filas de alumnos con nombre y escuela', () => {
    cy.intercept('GET', '/api/tutor/mis-beneficiarios', { statusCode: 200, body: ALUMNOS_MOCK }).as('getAlumnos')
    visitWithSession('/tutor/alumnos')
    cy.wait('@getAlumnos')
    cy.contains('Ana Oviedo').should('be.visible')
    cy.contains('Secundaria Técnica 5').should('be.visible')
    cy.contains('Luis Hernández').should('be.visible')
    cy.contains('Primaria Benito Juárez').should('be.visible')
  })

  // CP-TUTOR-11
  it('expande el panel del alumno y muestra datos de contacto y sesiones', () => {
    cy.intercept('GET', '/api/tutor/mis-beneficiarios', { statusCode: 200, body: ALUMNOS_MOCK }).as('getAlumnos')
    visitWithSession('/tutor/alumnos')
    cy.wait('@getAlumnos')
    cy.contains('Ana Oviedo').click()
    cy.contains('Sesiones').should('be.visible')
    cy.contains('Total').should('be.visible')
    cy.contains('Realizadas').should('be.visible')
    cy.contains('Pendientes').should('be.visible')
    cy.contains('Contacto').should('be.visible')
    cy.contains('ana@test.com').should('be.visible')
    cy.contains('María Oviedo').should('be.visible')
    cy.contains('2221234567').should('be.visible')
  })

  // CP-TUTOR-12
  it('muestra las barras de progreso de exámenes cuando hay calificaciones', () => {
    cy.intercept('GET', '/api/tutor/mis-beneficiarios', { statusCode: 200, body: ALUMNOS_MOCK }).as('getAlumnos')
    visitWithSession('/tutor/alumnos')
    cy.wait('@getAlumnos')
    cy.contains('Ana Oviedo').click()
    cy.contains('Progreso académico').should('be.visible')
    cy.contains('Examen inicio').should('be.visible')
    cy.contains('Examen término').should('be.visible')
  })

  // CP-TUTOR-13
  it('muestra el estado vacío cuando el tutor no tiene alumnos asignados', () => {
    cy.intercept('GET', '/api/tutor/mis-beneficiarios', { statusCode: 200, body: [] }).as('getAlumnosVacios')
    visitWithSession('/tutor/alumnos')
    cy.wait('@getAlumnosVacios')
    cy.contains('Sin alumnos asignados').should('be.visible')
  })

  // CP-TUTOR-14
  it('al hacer click en "Registrar" abre el modal de calificaciones', () => {
    cy.intercept('GET', '/api/tutor/mis-beneficiarios', { statusCode: 200, body: ALUMNOS_MOCK }).as('getAlumnos')
    visitWithSession('/tutor/alumnos')
    cy.wait('@getAlumnos')
    cy.contains('Luis Hernández').click()
    cy.contains('Registrar').click()
    cy.contains('Calificaciones — Luis Hernández').should('be.visible')
    cy.contains('Examen de inicio').should('be.visible')
    cy.contains('Examen de término').should('be.visible')
  })

  // CP-TUTOR-15
  it('redirige a /login si se accede sin autenticación', () => {
    cy.logout()
    cy.visit('/tutor/alumnos')
    cy.url().should('include', '/login')
  })
})
