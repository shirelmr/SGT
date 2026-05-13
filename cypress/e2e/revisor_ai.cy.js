describe('Flujo de Revisor - Detalle de Bitácora', () => {
    beforeEach(() => {
    cy.login('itzel@test.com', '123456');
    
    // CORRECCIÓN quité el fixture de la IA y le pasé el body directamente
    cy.intercept('GET', '**/api/bitacoras/1', {
        statusCode: 200,
        body: {
            id: 1,
            estado: 'pendiente',
            sesion: {
                id_sesion: 1,
                tema: 'Álgebra Básica',
                duracion_hrs: 2
            }
        }
    }).as('getBitacora');
    
    cy.intercept('GET', '**/api/comentarios/1', { statusCode: 200, body: [] }).as('getComentarios');
    cy.intercept('GET', '**/api/incidencias/sesion/1', { statusCode: 200, body: [] }).as('getIncidencias');
    
    cy.visit('/revisor/bitacoras/1');
    cy.wait(['@getBitacora', '@getComentarios', '@getIncidencias']);
    });

    it('TC-01: Aprobar bitácora y añadir comentario', () => {
        cy.intercept('POST', '/api/comentarios', { statusCode: 201 }).as('postComentario');
    
        cy.get('select[name="estado"]').select('aprobado');
        cy.get('textarea[name="texto"]').type('Buen trabajo.');
    
        cy.get('button[type="submit"]').click(); 
    
        cy.wait('@postComentario');
        cy.contains('Bitácora aprobada').should('be.visible');
    });

    it('TC-02: Validación de comentario vacío', () => {
        cy.get('button[type="submit"]').click();
        cy.contains('El comentario no puede estar vacío').should('be.visible');
    });

    it('TC-03: Manejo de error 500 al actualizar estado', () => {
        cy.intercept('PUT', '/api/bitacoras/1', { statusCode: 500 }).as('putError');
    
        cy.get('select').first().select('revisado');
    
        cy.wait('@putError');
        cy.contains('Error al actualizar el estado').should('be.visible');
    });
});