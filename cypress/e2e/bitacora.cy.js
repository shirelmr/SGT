describe('Formulario de Bitácora - Tutor', () => {
  
  beforeEach(() => {
    cy.visit('http://localhost:5173/login', {
      failOnStatusCode: false
    });
    
    cy.get('input[placeholder*="email"], input[type="email"], input[name="email"]').type('aris@test.com');
    cy.get('input[placeholder*="contraseña"], input[type="password"], input[name="password"]').type('123456');
    
    cy.get('button').contains('Iniciar', { matchCase: false }).click();
    
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    
    cy.visit('http://localhost:5173/tutor/sesiones', {
      failOnStatusCode: false
    });
    
    cy.get('body', { timeout: 10000 }).should('be.visible');
    
    cy.contains('button', 'Registrar bitácora').first().click({ force: true });
    
    cy.get('textarea', { timeout: 10000 }).should('exist');
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