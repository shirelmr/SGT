describe('Register Tutor', () => {
  beforeEach(() => {
    cy.logout()
    cy.visit('/register/tutor')
  })
  
  //CP-AUTH-27
  it('Render of register tutor page', () => {
    cy.contains('Registro de Tutor').should('be.visible')
    cy.get('input[placeholder="Juan Pérez"]').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.contains('label', 'Matrícula').parent().find('input').should('be.visible')
    cy.contains('label', 'Carrera').parent().find('input').should('be.visible')
    cy.contains('label', 'Semestre').parent().find('input').should('be.visible')
    cy.get('input[type="password"]').should('have.length', 2)
    cy.contains('button[type="submit"]', 'Crear cuenta').scrollIntoView().should('be.visible')
  })

  //CP-AUTH-28
  it('Navigation to login when clicking "Iniciar sesión"', () => {
  })

  //CP-AUTH-29
  it('Empty fields validation and messages', () => {
  })

  //CP-AUTH-30
  it('Invalid email format validation and message', () => {
  })

  //CP-AUTH-31
  it('Password mismatch validation and message', () => {
  })

  //CP-AUTH-32
  it('Password length validation and message', () => {
  })

  //CP-AUTH-33
  it('Invalid semester validation and message', () => {
  })

  //CP-AUTH-34
  it('Invalid enrollment validation and message', () => {
  })

  //CP-AUTH-35
  it('Successful registration', () => {
  })

  //CP-AUTH-36
  it('Session persistence after registration', () => {
  })

  //CP-AUTH-37
  it('Duplicate mail validation and message', () => {
  })

  //CP-AUTH-38
  it('Payload for tutor', () => {
  })

  //CP-AUTH-39
  it('Clean Payload', () => {
  })

  //CP-AUTH-40
  it('Invalid calls with invalid form', () => {
  })

  //CP-AUTH-41
  it('LocalStorage persistence after registration', () => {
  })

})