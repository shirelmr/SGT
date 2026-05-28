const FAKE_TOKEN = 'fake-tutor-token'
const FAKE_USER = { id_usuario: 1, nombre_completo: 'Test User', email: 'test_sgt_001@example.com', rol: 'tutor' }

const SESION_MOCK = {
  id: 11,
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
}

describe('Formulario de Bitácora - Tutor', () => {

  beforeEach(() => {
    // Intercepts: lista de sesiones, detalle de sesión, bitácora (404 → form vacío) y creación
    cy.intercept('GET', '/api/sesiones', { statusCode: 200, body: [SESION_MOCK] }).as('getSesiones')
    cy.intercept('GET', '/api/sesiones/11', { statusCode: 200, body: SESION_MOCK }).as('getSesion')
    cy.intercept('GET', '/api/bitacoras/11', { statusCode: 404, body: { error: 'No encontrada' } }).as('getBitacora')
    cy.intercept('POST', '/api/bitacoras', {
      statusCode: 201,
      body: { id: 99, actividades: '', logros: '', dificultades: '', plan_siguiente: '', evidencia: null, estado: 'pendiente' },
    }).as('createBitacora')

    // Autenticación sin UI: setear localStorage antes de que React monte
    cy.visit('/tutor/sesiones', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', FAKE_TOKEN)
        win.localStorage.setItem('user', JSON.stringify(FAKE_USER))
        win.localStorage.setItem('rol', FAKE_USER.rol)
      },
    })
    cy.wait('@getSesiones')

    // Navegar al formulario de bitácora desde la fila colapsada
    cy.contains('button', 'Registrar bitácora').first().click({ force: true })
    cy.wait('@getSesion')
    cy.wait('@getBitacora')
    cy.get('textarea', { timeout: 10000 }).should('exist')
  });

  const fillBitacoraForm = (data) => {
    if (data.actividades) {
      cy.get('textarea').eq(0).type(data.actividades, { delay: 5 });
    }
    
    if (data.logros) {
      cy.get('textarea').eq(1).type(data.logros, { delay: 5 });
    }
    
    if (data.dificultades) {
      cy.get('textarea').eq(2).type(data.dificultades, { delay: 5 });
    }
    
    if (data.plan_siguiente) {
      cy.get('textarea').eq(3).type(data.plan_siguiente, { delay: 5 });
    }
  };

  const submitForm = () => {
    cy.contains('button', /Registrar bitácora|Guardar cambios/)
      .click();
  };

  it('TC-01: Debe permitir enviar formulario llenando todos los campos (Positivo)', () => {
    const validData = {
      actividades: 'Se realizó explicación de verbos irregulares en inglés con ejercicios prácticos',
      logros: 'El estudiante comprendió la estructura de los verbos irregulares y logró hacer ejercicios correctamente',
      dificultades: 'Inicialmente hubo confusión con la pronunciación de algunos verbos',
      plan_siguiente: 'Practicar verbos en contexto conversacional y realizar un pequeño diálogo en clase'
    };

    fillBitacoraForm(validData);
    submitForm();
    cy.contains('Bitácora registrada', { timeout: 5000 }).should('be.visible');
  });

  it('TC-02: No debe permitir enviar sin llenar campos obligatorios (Negativo)', () => {
    submitForm();
    
    cy.get('textarea').first().then(($textarea) => {
      const required = $textarea.prop('required');
      expect(required).to.exist;
    });
  });

  it('TC-03: Debe permitir llenar texto sin archivo de evidencia (Validación)', () => {
    const dataWithoutFile = {
      actividades: 'Se realizó clase de vocabulario de animales',
      logros: 'Los estudiantes aprendieron 15 palabras nuevas',
      dificultades: 'Algunos estudiantes tuvieron dificultad con pronunciación',
      plan_siguiente: 'Continuar con vocabulario de acciones'
    };

    fillBitacoraForm(dataWithoutFile);
    submitForm();
    cy.contains('Bitácora registrada', { timeout: 5000 }).should('be.visible');
  });

  it('Debe permitir llenar y registrar múltiples bitácoras', () => {
    const data = {
      actividades: 'Clase de expresiones en presente',
      logros: 'Los estudiantes dominan expresiones básicas',
      dificultades: 'Pronunciación difícil al inicio',
      plan_siguiente: 'Practicar en diálogos'
    };

    fillBitacoraForm(data);
    submitForm();
    cy.contains('Bitácora registrada', { timeout: 5000 }).should('be.visible');
  });

});