describe('Módulo de Revisor - Cobertura Completa E2E', () => {
    beforeEach(() => {
        cy.login('itzel@test.com', '123456'); 
    });

  // =========================================================
  // BLOQUE 1: PRUEBAS DEL DASHBOARD 
  // =========================================================
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
            // Validar Widget de Saludo
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
            // Texto actualizado para que coincida exactamente con Dashboard.jsx
            cy.contains('Estás al día con tus revisiones.').should('be.visible');
        });

        it('TC-03: Debería navegar al detalle de la bitácora al hacer clic en "Revisar" desde la lista rápida', () => {
            cy.intercept('GET', '**/api/bitacoras', {
                statusCode: 200,
                body: [{ id: 99, estado: 'pendiente', sesion: { tema: 'Phrasal Verbs' } }]
            });

            cy.visit('/revisor/dashboard');
            // Hacer clic en el botón de la lista rápida
            cy.contains('Phrasal Verbs').should('be.visible');
            cy.contains('a', 'Revisar').click();
            // Validar redirección
            cy.url().should('include', '/revisor/bitacoras/99');
        });
    });

  // =========================================================
  // BLOQUE 2: PRUEBAS DEL DETALLE Y MODAL OBLIGATORIO
  // =========================================================
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

            // clic en Cancelar
            cy.contains('button', 'Cancelar').click();

            // Validamos que el modal se cierra y no hay toast de éxito
            cy.contains('Comentario Obligatorio').should('not.exist');
            cy.contains('Estado actualizado').should('not.exist');
        });

        it('TC-06: (Validación) Debería bloquear el envío y pintar rojo el input si el motivo está vacío', () => {
            cy.get('select').select('no_aprobada');
            // IntentaR guardar sin escribir nada
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
    
        it('TC-11: (Validación) Debería bloquear el envío y pintar rojo el input si el motivo está vacío', () => {
            cy.get('select').first().select('no_aprobada');
            cy.contains('button', 'Confirmar y Guardar').click();
            cy.contains('Debes ingresar un motivo para continuar.').should('be.visible');
            cy.get('textarea[placeholder="Escribe el motivo aquí..."]').should('have.class', 'border-red-400');
        });

        it('TC-12: (Happy Path) Debería rechazar la bitácora exitosamente al llenar el motivo obligatorio', () => {
            cy.intercept('PUT', '**/api/bitacoras/1', { statusCode: 200 }).as('updateRechazo');
            cy.intercept('POST', '**/api/comentarios', { statusCode: 201 }).as('createComentario');
            cy.intercept('GET', '**/api/comentarios/1', { 
                statusCode: 200, body: [{ id: 2, texto: 'Falta evidencia del Kahoot quiz.', fecha_creacion: new Date() }] 
            }).as('refreshComentarios');

            cy.get('select').first().select('no_aprobada');
            cy.get('textarea[placeholder="Escribe el motivo aquí..."]').type('Falta evidencia del Kahoot quiz.');
            cy.contains('button', 'Confirmar y Guardar').click();

            cy.wait(['@updateRechazo', '@createComentario', '@refreshComentarios']);
            cy.contains('Estado actualizado y motivo enviado').should('be.visible');
            cy.contains('Falta evidencia del Kahoot quiz.').should('be.visible');
        });

        it('TC-13: (Happy Path) Debería aprobar sin horas exitosamente al llenar el motivo obligatorio', () => {
            cy.intercept('PUT', '**/api/bitacoras/1', { statusCode: 200 }).as('updateSinHoras');
            cy.intercept('POST', '**/api/comentarios', { statusCode: 201 }).as('createComentario');
            
            cy.get('select').first().select('aprobado_sin_horas');
            cy.get('textarea[placeholder="Escribe el motivo aquí..."]').type('Student was absent. Sesión aprobada sin contar horas.');
            cy.contains('button', 'Confirmar y Guardar').click();

            cy.wait('@updateSinHoras');
            cy.contains('Sesión aprobada sin horas. Comentario guardado.').should('be.visible');
        });

        it('TC-14: (Validación) Debería agregar un comentario manual libre y mostrar error si intenta enviarlo vacío', () => {
            cy.contains('button', 'Publicar comentario').click();
            cy.contains('El comentario no puede estar vacío').should('be.visible'); 

            cy.intercept('POST', '**/api/comentarios', { statusCode: 201 }).as('createManual');
            cy.get('textarea[placeholder="Escribe retroalimentación para el tutor..."]').type('Good grammar explanation.');
            cy.contains('button', 'Publicar comentario').click();
            cy.wait('@createManual');
            cy.contains('Comentario enviado').should('be.visible');
        });

        it('TC-15: (Navegación) Debería regresar a la lista al dar clic en Finalizar revisión', () => {
            cy.contains('button', 'Finalizar revisión y regresar').click();
            cy.url().should('not.include', '/revisor/bitacoras/1');
        });
    });

  // =========================================================
  // BLOQUE 4: CASOS EXTREMOS, EVIDENCIAS Y MANEJO DE ERRORES
  // =========================================================

    context('Casos Extremos y Detalles de UI', () => {
        it('TC-16: (UI Gráfica) Muestra mensaje de "Sin datos suficientes" en la gráfica cuando no hay bitácoras', () => {
            // Devolvemos 0 bitácoras para probar el Empty State de Recharts
            cy.intercept('GET', '**/api/bitacoras', { statusCode: 200, body: [] }).as('getEmptyChart');
            cy.visit('/revisor/dashboard');
            cy.wait('@getEmptyChart');

            // Validamos que la gráfica detecte la falta de datos y muestre su texto alternativo
            cy.contains('Sin datos suficientes').should('be.visible');
        });

        it('TC-17: (Filtros API) Actualiza la tabla al cambiar de "Periodo" en el dropdown principal', () => {
            // Usamos el formato de objeto para atrapar la ruta exacta
            cy.intercept({ method: 'GET', pathname: '/api/periodos' }, {
                statusCode: 200,
                body: [
                    // Agregamos id_periodo para asegurar que empate con la base de datos
                    { id: 1, id_periodo: 1, nombre: 'Spring Semester', activo: true },
                    { id: 2, id_periodo: 2, nombre: 'Fall Semester', activo: false }
                ]
            }).as('getPeriodosMulti');

            // Intercepción 100% estricta separando el query param del pathname
            cy.intercept({ method: 'GET', pathname: '/api/bitacoras', query: { id_periodo: '1' } }, { 
                statusCode: 200, body: [] 
            }).as('getBitacorasP1');

            cy.intercept({ method: 'GET', pathname: '/api/bitacoras', query: { id_periodo: '2' } }, {
                statusCode: 200, 
                body: [{ id: 5, id_sesion: 5, estado: 'pendiente', sesion: { fecha: '2026-08-15', tutor: { nombre_completo: 'Teacher John' } } }] 
            }).as('getBitacorasP2');
        
            // Al usar solo pathname, Cypress atrapa las incidencias automáticamente, sin importar qué id_periodo lleve
            cy.intercept({ method: 'GET', pathname: '/api/incidencias/sesiones-sin-bitacora' }, { 
                statusCode: 200, body: [] 
            }).as('getIncidencias');

            cy.visit('/revisor/bitacoras');

            // Esperamos que la vista inicial cargue el periodo 1
            cy.wait(['@getPeriodosMulti', '@getBitacorasP1', '@getIncidencias']);

            // Cambiamos el select principal al segundo periodo (valor "2")
            cy.get('select').eq(0).select('2'); 
            cy.wait('@getBitacorasP2'); // Esperamos la petición específica del periodo 2

            // Validamos que el tutor exclusivo del nuevo periodo aparezca
            cy.contains('Teacher John').should('be.visible');
        });

        it('TC-18: (Empty State Total) Muestra el diseño vacío si el periodo activo no tiene NINGUNA bitácora', () => {
            cy.intercept({ method: 'GET', pathname: '/api/periodos' }, { 
                statusCode: 200, body: [{ id: 1, id_periodo: 1, nombre: 'Summer', activo: true }] 
            }).as('getPeriodosSummer');

            cy.intercept({ method: 'GET', pathname: '/api/bitacoras', query: { id_periodo: '1' } }, { 
                statusCode: 200, body: [] 
            }).as('getVacias');

            cy.intercept({ method: 'GET', pathname: '/api/incidencias/sesiones-sin-bitacora' }, { 
                statusCode: 200, body: [] 
            }).as('getIncidencias');

            cy.visit('/revisor/bitacoras');
            cy.wait(['@getPeriodosSummer', '@getVacias', '@getIncidencias']);
            cy.contains('No hay bitácoras en este periodo').should('be.visible');
            cy.get('table').should('not.contain', 'Revisar'); 
        });

        it('TC-19: (UI Evidencia) Debería renderizar un botón para ver el archivo si el tutor subió un PDF', () => {
            // Mockeamos el detalle pero agregamos la propiedad "evidencia"
            cy.intercept('GET', '**/api/bitacoras/1', {
                statusCode: 200,
                body: {
                    id: 1, estado: 'pendiente', evidencia: '/uploads/homework_reading.pdf', // Simulamos un PDF adjunto
                    sesion: { id_sesion: 1, tema: 'Reading Comprehension', tutor: { nombre_completo: 'Teacher Sarah' } }
                }
            }).as('getDetalleConEvidencia');

            cy.intercept('GET', '**/api/comentarios/1', { statusCode: 200, body: [] });
            cy.intercept('GET', '**/api/incidencias/sesion/1', { statusCode: 200, body: [] });
            cy.visit('/revisor/bitacoras/1');
            cy.wait('@getDetalleConEvidencia');
            // Validamos que se muestre la etiqueta de Evidencia y el botón de "Ver PDF"
            cy.contains('Evidencia').should('be.visible');
            cy.contains('Ver PDF').should('be.visible');
        });

        it('TC-20: (UI Informativa) Debería mostrar la caja amarilla con las reglas de acreditación de horas', () => {
            // Mock estándar para renderizar el detalle
            cy.intercept('GET', '**/api/bitacoras/1', {
                statusCode: 200,
                body: { id: 1, estado: 'pendiente', sesion: { id_sesion: 1, tema: 'Speaking Practice', duracion_hrs: 2 } }
            }).as('getDetalle');
            cy.intercept('GET', '**/api/comentarios/1', { statusCode: 200, body: [] });
            cy.intercept('GET', '**/api/incidencias/sesion/1', { statusCode: 200, body: [] });
            cy.visit('/revisor/bitacoras/1');
            cy.wait('@getDetalle');
            // Validamos los textos específicos de la alerta (bg-yellow-50) para asegurar que el revisor esté informado
            cy.contains('acredita 2 horas al tutor.').should('be.visible');
            cy.contains('Aprobado sin horas: para sesiones no impartidas').should('be.visible');
        });
    });
});