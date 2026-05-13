describe('Revisor', () => {
    beforeEach(() => {
    cy.login('itzel@test.com', '123456'); 

    cy.intercept('GET', '**/api/bitacoras/1', {
        statusCode: 200,
        body: {
            id: 1,
            actividades: 'Se revisaron temas de álgebra.',
            logros: 'Alumno resolvió 5 ecuaciones.',
            estado: 'pendiente',
            sesion: {
            id_sesion: 1,
            tema: 'Algebra basica',
            fecha: '2026-05-13T10:00:00Z',
            tutor: { nombre_completo: 'Arístides Nieto' },
            beneficiario: { nombre_completo: 'Ana Paola Oviedo' },
            duracion_hrs: 2
        }
    }
    }).as('getBitacora');

    cy.intercept('GET', '**/api/comentarios/1', { statusCode: 200, body: [] }).as('getComentarios');
    cy.intercept('GET', '**/api/incidencias/sesion/1', { statusCode: 200, body: [] }).as('getIncidencias');

    cy.visit('/revisor/bitacoras/1');
    cy.wait(['@getBitacora', '@getComentarios', '@getIncidencias']);
});

it('TC-01 Positivo: Debería aprobar la bitácora y añadir un comentario exitosamente', () => {
    cy.intercept('POST', '**/api/comentarios', {
        statusCode: 201,
        body: { id: 10, texto: 'Buen trabajo.', estado: 'aprobado' }
    }).as('createComentario');

    cy.get('select[name="estado"]').select('aprobado');
    cy.get('textarea[name="texto"]').type('Buen trabajo.');
    cy.contains('Al aprobar esta bitácora se acreditarán 2 horas').should('be.visible');
    cy.contains('button', 'Aprobar bitácora').click();
    
    cy.wait('@createComentario');
    cy.contains('Bitácora aprobada y horas acreditadas').should('be.visible');
});

it('TC-02 Negativo: Debería mostrar error de validación al intentar publicar un comentario vacío', () => {
    cy.contains('button', 'Publicar comentario').click();
    cy.contains('El comentario no puede estar vacío').should('be.visible'); 
    });

it('TC-03 Negativo: Debería mostrar un Toast de error si el servidor falla al actualizar el estado', () => {
    cy.intercept('PUT', '**/api/bitacoras/1', {
        statusCode: 500,
        body: { error: 'Error interno del servidor' }
    }).as('updateBitacoraError');

    cy.get('select').not('[name="estado"]').first().select('revisado');

    cy.wait('@updateBitacoraError');

    cy.contains('Error al actualizar el estado').should('be.visible');
    });
});