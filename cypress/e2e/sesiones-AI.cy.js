describe('E2E: Gestión de Sesiones - Perfil Tutor (Alternativo)', () => {

  beforeEach(() => {
    // Asegurarse de empezar con estado limpio en cada test
    cy.clearLocalStorage();
  });

  it('TC-01 [Positivo]: Debe mostrar el listado completo de sesiones con sus estados y acciones', () => {
    // Simulamos la respuesta de la API con datos en línea (inline)
    cy.intercept('GET', '/api/sesiones', {
      statusCode: 200,
      body: [
        {
          id: 101,
          tema: 'Física Cuántica',
          estado: 'realizada',
          fecha: '2026-10-12T00:00:00.000Z',
          hora_inicio: '14:00',
          duracion_hrs: 2,
          beneficiario: { nombre_completo: 'Estudiante Alfa' },
          periodo: { nombre: '2026-2' },
          bitacora: { id_bitacora: 20, estado: 'aprobado' }
        },
        {
          id: 102,
          tema: 'Química Orgánica',
          estado: 'programada',
          fecha: '2026-10-15T00:00:00.000Z',
          hora_inicio: '16:00',
          duracion_hrs: 1.5,
          beneficiario: { nombre_completo: 'Estudiante Beta' },
          periodo: { nombre: '2026-2' },
          bitacora: null
        }
      ]
    }).as('fetchSesiones');

    // Autenticamos al usuario directamente en el ciclo de vida de la visita
    cy.visit('/tutor/sesiones', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('token', 'tutor-jwt-mock');
        win.localStorage.setItem('rol', 'tutor');
        win.localStorage.setItem('user', JSON.stringify({ id_usuario: 88, nombre_completo: 'Tutor IA' }));
      }
    });

    cy.wait('@fetchSesiones');

    // Validaciones de la primera sesión usando encadenamiento y expresiones regulares
    cy.contains(/Física Cuántica/i).should('exist');
    cy.contains(/realizada/i).should('exist');
    cy.contains(/Aprobada/i).should('exist'); // Badge de bitácora
    cy.contains(/Ver bitácora/i).should('be.visible');

    // Validaciones de la segunda sesión
    cy.contains(/Química Orgánica/i).should('exist');
    cy.contains(/programada/i).should('exist');
    cy.contains(/Registrar bitácora/i).should('be.visible');
  });

  it('TC-02 [Negativo]: Debe renderizar el estado vacío cuando la API no retorna datos', () => {
    // Simulamos un arreglo vacío
    cy.intercept('GET', '/api/sesiones', { body: [] }).as('fetchSesionesEmpty');

    cy.visit('/tutor/sesiones', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('token', 'tutor-jwt-mock');
        win.localStorage.setItem('rol', 'tutor');
        win.localStorage.setItem('user', JSON.stringify({ id_usuario: 88, nombre_completo: 'Tutor IA', rol: 'tutor' }));
      }
    });

    cy.wait('@fetchSesionesEmpty');

    // Verificamos el Empty State con aserciones que reintentan hasta que React renderice
    cy.contains('Sin sesiones').should('be.visible');
    cy.contains('Nueva sesión').should('be.visible');
  });

  it('TC-03 [Negativo]: Debe prohibir el acceso y redirigir al login si no hay token activo', () => {
    // Al usar cy.clearLocalStorage() en el beforeEach y no inyectar nada, 
    // simulamos a un usuario completamente deslogueado.
    cy.visit('/tutor/sesiones');
    
    // La aplicación debería interceptar la falta de sesión y redirigir al login.
    // Usamos regex para validar que la URL contenga /login de forma flexible
    cy.url().should('match', /\/login/);
  });

});
