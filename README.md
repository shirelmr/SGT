# SGT - Sistema de Gestión de Tutorías

Sistema web para gestionar programas de tutorías académicas, facilitando la coordinación entre tutores, beneficiarios, revisores y coordinadores.

## Descripción

SGT es una plataforma integral que permite:
- Gestionar postulaciones de tutores
- Asignar tutores a beneficiarios
- Programar y registrar sesiones de tutoría
- Llevar registro de asistencias e incidencias
- Contabilizar y aprobar horas acreditadas
- Generar reportes y estadísticas de progreso
- Gestionar múltiples períodos académicos

## Estructura del Proyecto

```
SGT/
├── back/                    # Backend (Node.js + Express)
│   ├── src/
│   │   ├── routes/         # Endpoints de la API
│   │   ├── middleware/     # Middleware de autenticación
│   │   ├── scripts/        # Scripts utilitarios
│   │   ├── db.js          # Configuración de Prisma
│   │   ├── mailer.js      # Configuración de correos
│   │   └── index.js       # Entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Modelo de datos
│   │   └── migrations/    # Migraciones de BD
│   └── uploads/           # Archivos subidos
│
├── front/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── api/           # Servicios API
│   │   ├── components/    # Componentes reutilizables
│   │   ├── context/       # Context API (Auth)
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Páginas/Vistas
│   │   └── routes/        # Configuración de rutas
│   └── public/            # Assets estáticos
│
├── cypress/               # Tests E2E
│   ├── e2e/              # Specs por módulo
│   ├── fixtures/         # Datos de prueba
│   └── support/          # Comandos personalizados
│
├── docs/                 # Documentación
│   ├── calidad/         # Plan de calidad
│   └── database/        # Diagramas de BD
│
└── docker-compose.yml   # Orquestación de servicios
```
---
