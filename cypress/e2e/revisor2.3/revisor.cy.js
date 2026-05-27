describe('Módulo de Revisor - Cobertura Completa E2E', () => {
    beforeEach(() => {
        cy.login('itzel@test.com', '123456'); 
    });

  // BLOQUE 1: PRUEBAS DEL DASHBOARD REDISEÑADO

  context('Dashboard del Revisor', () => {
    
    it('TC-01: Debería renderizar el widget de saludo, KPIs y la gráfica correctamente', () => {
      cy.intercept('GET', '**/api/bitacoras', {
        statusCode: 200,
        body: [
          { id: 1, estado: 'pendiente', sesion: { tema: 'Verb To Be', fecha: '2026-05-24' } },
          { id: 2, estado: 'aprobado', sesion: { tema: 'Present Simple', fecha: '2026-05-20' } }
        ]
      }).as('getBitacoras');

      cy.visit('/revisor/dashboard');
      cy.wait('@getBitacoras');

      // Validar Widget de Saludo (Texto exacto del estilo Coordinador)
      cy.contains('Aquí tienes tu resumen de revisiones asignadas.').should('be.visible');

      // Validar KPIs
      cy.contains('Total Asignadas').parent().contains('2').should('be.visible');
      cy.contains('Revisadas').parent().contains('1').should('be.visible');
      cy.contains('Pendientes').parent().contains('1').should('be.visible');

      // Validar Gráfica
      cy.contains('Distribución de Bitácoras').should('be.visible');
    });

    it('TC-02: Debería mostrar el estado vacío (Empty State) si no hay bitácoras urgentes', () => {
      cy.intercept('GET', '**/api/bitacoras', { statusCode: 200, body: [] }).as('getEmptyBitacoras');
      
      cy.visit('/revisor/dashboard');
      cy.wait('@getEmptyBitacoras');

      cy.contains('Revisión Inmediata').should('be.visible');
      // Texto exacto del Empty State actualizado
      cy.contains('Estás al día con tus revisiones.').should('be.visible');
    });

    it('TC-03: Debería navegar al detalle de la bitácora al hacer clic en "Revisar" desde la lista rápida', () => {
      cy.intercept('GET', '**/api/bitacoras', {
        statusCode: 200,
        body: [{ id: 99, estado: 'pendiente', sesion: { tema: 'Phrasal Verbs' } }]
      });

      cy.visit('/revisor/dashboard');
      
      cy.contains('Phrasal Verbs').should('be.visible');
      cy.contains('a', 'Revisar').click();
      
      cy.url().should('include', '/revisor/bitacoras/99');
    });
  });

  // BLOQUE 2: PRUEBAS DEL DETALLE Y MODAL OBLIGATORIO
  context('Detalle de Bitácora y Validaciones', () => {
    
    beforeEach(() => {
      cy.intercept('GET', '**/api/bitacoras/1', {
        statusCode: 200,
        body: {
          id: 1,
          actividades: 'Practicamos la estructura del Present Perfect.',
          logros: 'El beneficiario logró formular oraciones afirmativas.',
          estado: 'pendiente',
          sesion: {
            id_sesion: 1,
            tema: 'Present Perfect',
            duracion_hrs: 1.5,
            tutor: { nombre_completo: 'Arístides Nieto' },
            beneficiario: { nombre_completo: 'Ana Oviedo' }
          }
        }
      }).as('getBitacora');
      cy.intercept('GET', '**/api/comentarios/1', { statusCode: 200, body: [] }).as('getComentarios');
      cy.intercept('GET', '**/api/incidencias/sesion/1', { statusCode: 200, body: [] }).as('getIncidencias');

      cy.visit('/revisor/bitacoras/1');
      cy.wait(['@getBitacora', '@getComentarios', '@getIncidencias']);
    });

    it('TC-04: (Happy Path) Debería aprobar la bitácora directamente sin activar el modal', () => {
      cy.intercept('PUT', '**/api/bitacoras/1', { statusCode: 200 }).as('updateAprobado');
      cy.get('select').select('aprobado');
      cy.wait('@updateAprobado');
      cy.contains('Bitácora aprobada y horas acreditadas').should('be.visible');
    });

    it('TC-05: (Edge Case) Debería abortar el cambio de estado si el usuario CANCELA el modal rojo', () => {
      cy.get('select').select('no_aprobada');
      cy.contains('Comentario Obligatorio').should('be.visible');
      
      // Hacemos clic en Cancelar
      cy.contains('button', 'Cancelar').click();
      
      // Validamos que el modal se cierra y no hay toast de éxito
      cy.contains('Comentario Obligatorio').should('not.exist');
      cy.contains('Estado actualizado').should('not.exist');
    });

    it('TC-06: (Validación) Debería bloquear el envío y pintar rojo el input si el motivo está vacío', () => {
      cy.get('select').select('no_aprobada');
      
      // Intentamos guardar sin escribir nada
      cy.contains('button', 'Confirmar y Guardar').click();
      
      // Validamos mensaje de error y clase de Tailwind
      cy.contains('Debes ingresar un motivo para continuar.').should('be.visible');
      cy.get('textarea[placeholder="Escribe el motivo aquí..."]').should('have.class', 'border-red-400');
    });

    it('TC-07: (Happy Path) Debería rechazar la bitácora exitosamente al llenar el motivo obligatorio', () => {
      cy.intercept('PUT', '**/api/bitacoras/1', { statusCode: 200 }).as('updateRechazo');
      cy.intercept('POST', '**/api/comentarios', { statusCode: 201 }).as('createComentario');
      cy.intercept('GET', '**/api/comentarios/1', { 
        statusCode: 200, body: [{ id: 2, texto: 'Falta evidencia del quiz.', fecha_creacion: new Date() }] 
      }).as('refreshComentarios');

      cy.get('select').select('no_aprobada');
      cy.get('textarea[placeholder="Escribe el motivo aquí..."]').type('Falta evidencia del quiz.');
      cy.contains('button', 'Confirmar y Guardar').click();

      cy.wait(['@updateRechazo', '@createComentario', '@refreshComentarios']);
      cy.contains('Estado actualizado y motivo enviado').should('be.visible');
      cy.contains('Falta evidencia del quiz.').should('be.visible');
    });

    it('TC-08: (Happy Path) Debería aprobar sin horas exitosamente al llenar el motivo obligatorio', () => {
      cy.intercept('PUT', '**/api/bitacoras/1', { statusCode: 200 }).as('updateSinHoras');
      cy.intercept('POST', '**/api/comentarios', { statusCode: 201 }).as('createComentario');
      
      cy.get('select').select('aprobado_sin_horas');
      cy.get('textarea[placeholder="Escribe el motivo aquí..."]').type('El alumno no se presentó, se aprueba sin contar horas.');
      cy.contains('button', 'Confirmar y Guardar').click();

      cy.wait('@updateSinHoras');
      cy.contains('Sesión aprobada sin horas. Comentario guardado.').should('be.visible');
    });

    it('TC-09: (Validación) Debería agregar un comentario manual libre y mostrar error si intenta enviarlo vacío', () => {
      // 1. Probar que falla si está vacío
      cy.contains('button', 'Publicar comentario').click();
      cy.contains('El comentario no puede estar vacío').should('be.visible'); 

      // 2. Probar éxito
      cy.intercept('POST', '**/api/comentarios', { statusCode: 201 }).as('createManual');
      cy.get('textarea[placeholder="Escribe retroalimentación para el tutor..."]').type('Good grammar explanation.');
      cy.contains('button', 'Publicar comentario').click();
      cy.wait('@createManual');
      cy.contains('Comentario enviado').should('be.visible');
    });

    it('TC-10: (Navegación) Debería regresar a la lista al dar clic en Finalizar revisión', () => {
      // Validamos que el botón gigante existe y funciona
      cy.contains('button', 'Finalizar revisión y regresar').click();
      
      // En Cypress, al dar "back" en el navegador simulado, la URL debería cambiar
      cy.url().should('not.include', '/revisor/bitacoras/1');
    });

  });
});