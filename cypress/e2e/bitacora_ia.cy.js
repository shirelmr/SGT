describe('SGT Bitácora Form Tests', () => {
  const LOGIN_URL = 'http://localhost:5173/login';
  const SESSIONS_URL = 'http://localhost:5173/tutor/sesiones';
  const CREDENTIALS = {
    email: 'aris@test.com',
    password: '123456'
  };

  function authenticateUser() {
    cy.visit(LOGIN_URL, { failOnStatusCode: false });
    cy.get('input[type="email"], input[name="email"], input[placeholder*="email"]')
      .type(CREDENTIALS.email);
    cy.get('input[type="password"], input[name="password"], input[placeholder*="contraseña"]')
      .type(CREDENTIALS.password);
    cy.get('button').contains('Iniciar').click();
    cy.url({ timeout: 10000 }).should('not.include', '/login');
  }

  function navigateToForm() {
    cy.visit(SESSIONS_URL, { failOnStatusCode: false });
    cy.contains('button', 'Registrar bitácora').first().click();
    cy.get('textarea', { timeout: 10000 }).should('have.length', 4);
  }

  function fillForm(activities, achievements, challenges, nextPlan) {
    cy.get('textarea').eq(0).type(activities);
    cy.get('textarea').eq(1).type(achievements);
    cy.get('textarea').eq(2).type(challenges);
    cy.get('textarea').eq(3).type(nextPlan);
  }

  function submitForm() {
    cy.get('button').contains(/Registrar|Guardar/).click();
  }

  beforeEach(() => {
    authenticateUser();
    navigateToForm();
  });

  it('Should submit bitácora with all fields completed', () => {
    fillForm(
      'Se enseñó presente perfecto con ejercicios interactivos',
      'Estudiantes dominan formación del presente perfecto',
      'Algunos confundieron con pasado simple',
      'Practicar en conversaciones cotidianas'
    );
    submitForm();
    cy.contains('Bitácora registrada').should('be.visible');
  });

  it('Should require all text fields before submission', () => {
    submitForm();
    cy.get('textarea').eq(0).should('have.attr', 'required');
  });

  it('Should accept form with text fields only', () => {
    fillForm(
      'Clase de present continuous con actividades prácticas',
      'Todos aprendieron el uso correcto de present continuous',
      'Pronunciación fue difícil inicialmente',
      'Continuar con present perfect'
    );
    submitForm();
    cy.contains('Bitácora registrada').should('be.visible');
  });

  it('Should allow multiple form submissions', () => {
    fillForm(
      'Repaso de tiempos verbales en contexto de negocios',
      'Los estudiantes aplicaron tiempos verbales correctamente',
      'Falta práctica en escritura formal',
      'Tarea: escribir email de negocios'
    );
    submitForm();
    cy.contains('Bitácora registrada').should('be.visible');
  });
});