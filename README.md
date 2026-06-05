# SGT — Sistema de Gestión Talk!

Plataforma web de gestión para el programa de tutorías **Talk!**, desarrollada por el equipo **AIAS**. Centraliza la administración de periodos, tutores, beneficiarios, sesiones, asistencias, bitácoras e incidencias con reportes exportables a Excel.

[![Backend](https://img.shields.io/badge/Backend-Node.js%2020%20%2B%20Express%205-339933?logo=nodedotjs)](https://nodejs.org)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-61DAFB?logo=react)](https://react.dev)
[![ORM](https://img.shields.io/badge/ORM-Prisma%207-2D3748?logo=prisma)](https://prisma.io)
[![DB](https://img.shields.io/badge/DB-PostgreSQL-4169E1?logo=postgresql)](https://postgresql.org)
[![Tests](https://img.shields.io/badge/Tests-Cypress%20E2E-17202C?logo=cypress)](https://cypress.io)

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Roles del sistema](#roles-del-sistema)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación local](#instalación-local)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos](#base-de-datos)
- [Ejecución con Docker](#ejecución-con-docker)
- [Tests E2E](#tests-e2e)
- [Despliegue en producción](#despliegue-en-producción)
- [Equipo](#equipo)

---

## Descripción

SGT es un monorepo con dos aplicaciones independientes:

| Módulo | Tecnología | Responsabilidad |
|--------|-----------|-----------------|
| `/back` | Node.js + Express + Prisma | API REST, autenticación JWT, lógica de negocio |
| `/front` | React + Vite + Tailwind CSS | SPA por roles, dashboards, exportación Excel |

**Funcionalidades principales:**

- Gestión de periodos académicos y usuarios por rol
- Postulaciones, asignación y seguimiento de tutores
- Programación y registro de sesiones con control de asistencias
- Bitácoras de tutoría con flujo de revisión y aprobación
- Registro de incidencias (retardos, inasistencias, etc.)
- Contabilización y aprobación de horas acreditadas
- Exportación de reportes a Excel (`.xlsx`)
- Envío de correos transaccionales vía Resend
- Almacenamiento de imágenes de perfil vía Cloudinary

---

## Roles del sistema

| Rol | Descripción |
|-----|-------------|
| **Coordinador** | Administra periodos, usuarios y configuración general |
| **TutorTEC** | Registra sesiones, asistencias, bitácoras e incidencias |
| **Revisor** | Revisa y aprueba las bitácoras de los tutores |
| **Beneficiario** | Consulta su información y el historial de sesiones |

---

## Stack tecnológico

### Backend (`/back`)
- **Runtime:** Node.js 20 LTS
- **Framework:** Express 5
- **ORM:** Prisma 7 + `@prisma/adapter-pg`
- **Base de datos:** PostgreSQL (Neon en producción)
- **Autenticación:** `jsonwebtoken` + `bcryptjs`
- **Correos:** Resend
- **Imágenes:** Cloudinary + Multer
- **Utilidades:** `dayjs`, `cors`, `dotenv`

### Frontend (`/front`)
- **Framework:** React 19
- **Build tool:** Vite 8
- **Estilos:** Tailwind CSS 4
- **Ruteo:** React Router DOM 7
- **Forms:** React Hook Form
- **HTTP:** Axios
- **Gráficas:** Recharts
- **Notificaciones:** React Hot Toast
- **Exportación:** xlsx

### Testing
- **E2E:** Cypress 15 (tests por módulo y por rol)

### Infraestructura (producción)
- **Backend:** Render (Web Service)
- **Frontend:** Vercel
- **Base de datos:** Neon (PostgreSQL serverless)

---

## Estructura del proyecto

```
SGT/
├── back/                         # API REST
│   ├── prisma/
│   │   ├── schema.prisma         # Esquema de la base de datos
│   │   └── migrations/           # Historial de migraciones
│   ├── src/
│   │   ├── index.js              # Punto de entrada del servidor
│   │   ├── db.js                 # Instancia Prisma Client
│   │   ├── mailer.js             # Servicio de correo (Resend)
│   │   ├── middleware/           # Autenticación JWT
│   │   └── routes/               # Endpoints REST
│   │       ├── auth.js
│   │       ├── usuarios.js
│   │       ├── periodos.js
│   │       ├── sesiones.js
│   │       ├── asistencias.js
│   │       ├── bitacoras.js
│   │       ├── comentarios.js
│   │       ├── incidencias.js
│   │       ├── horas.js
│   │       ├── postulaciones.js
│   │       ├── tutor.js
│   │       ├── beneficiarioPeriodo.js
│   │       └── upload.js
│   ├── uploads/                  # Archivos subidos localmente
│   ├── Dockerfile
│   └── package.json
│
├── front/                        # SPA React
│   ├── src/
│   │   ├── main.jsx              # Punto de entrada React
│   │   ├── App.jsx               # Router principal
│   │   ├── api/                  # Servicios Axios por módulo
│   │   ├── components/
│   │   │   ├── layout/           # Shell, navbars, sidebars
│   │   │   ├── shared/           # Componentes reutilizables
│   │   │   └── ui/               # Primitivos de UI
│   │   ├── context/              # AuthContext
│   │   ├── hooks/                # Custom hooks
│   │   ├── pages/
│   │   │   ├── coordinador/
│   │   │   ├── tutor/
│   │   │   ├── revisor/
│   │   │   └── beneficiario/
│   │   └── routes/               # Rutas protegidas por rol
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── cypress/                      # Tests E2E
│   ├── e2e/
│   │   ├── auth2.1/
│   │   ├── tutor2.2/
│   │   ├── revisor2.3/
│   │   ├── beneficiario2.4/
│   │   ├── coord2.5/
│   │   └── integracion/
│   ├── fixtures/
│   └── support/
│
├── docs/                         # Documentación
│   ├── SGT_Manual_Instalacion_v1.0.docx
│   ├── calidad/
│   └── database/
│
├── docker-compose.yml
└── package.json                  # Scripts Cypress raíz
```

---

## Instalación local

### Requisitos previos

- Node.js 20.x LTS
- npm ≥ 10
- Git
- Instancia PostgreSQL accesible (local o Neon)

### 1. Clonar el repositorio

```bash
git clone https://github.com/shirelmr/SGT.git
cd SGT
```

### 2. Configurar el backend

```bash
cd back
npm install
cp .env.example .env   # edita con tus valores reales
```

### 3. Configurar la base de datos

```bash
# Aplicar el esquema en la base de datos
npx prisma migrate deploy

# Regenerar el cliente Prisma
npx prisma generate
```

### 4. Configurar el frontend

```bash
cd ../front
npm install
cp .env.example .env   # edita VITE_API_URL
```

### 5. Levantar ambos servicios

Abre dos terminales:

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd back
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd front
npm run dev
```

---

## Variables de entorno

### `/back/.env`

```env
# Base de datos
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/sgt_db?sslmode=require"

# JWT
JWT_SECRET="clave-secreta-minimo-32-caracteres"
JWT_EXPIRES_IN="8h"

# Correo (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@tudominio.com"

# Imágenes (Cloudinary)
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"

# Servidor
CORS_ORIGIN="http://localhost:5173"
PORT=3000
```

### `/front/.env`

```env
VITE_API_URL="http://localhost:3000/api"
```

> En producción reemplaza `VITE_API_URL` con la URL pública de Render y `CORS_ORIGIN` con la URL de Vercel.

---

## Base de datos

El esquema se define en `back/prisma/schema.prisma`. Los modelos principales son:

`Usuario` · `Periodo` · `Tutor` · `Beneficiario` · `Revisor` · `Coordinador` · `Sesion` · `Asistencia` · `Bitacora` · `Comentario` · `Incidencia` · `Postulacion`

**Comandos Prisma útiles:**

```bash
# Aplicar migraciones existentes (producción)
npx prisma migrate deploy

# Sincronizar esquema sin migraciones (desarrollo)
npx prisma db push

# Abrir Prisma Studio (explorador visual de datos)
npx prisma studio

# Regenerar cliente tras cambios al schema
npx prisma generate
```

---

## Ejecución con Docker

El proyecto incluye un `docker-compose.yml` que levanta backend y frontend con hot-reload:

```bash
# Desde la raíz del proyecto
docker compose up --build
```

| Servicio | Puerto |
|----------|--------|
| Backend  | `3000` |
| Frontend | `5173` |

> La variable `VITE_API_URL` ya está configurada en `docker-compose.yml` apuntando al backend del contenedor.

---

## Tests E2E

Los tests usan **Cypress 15** y están organizados por módulo y rol.

```bash
# Instalar dependencias (desde la raíz)
npm install

# Abrir Cypress en modo interactivo
npm run cy:open

# Correr todos los tests en headless
npm run cy:run
```

| Suite | Cobertura |
|-------|-----------|
| `auth2.1` | Login, logout, recuperación de contraseña |
| `tutor2.2` | Sesiones, asistencias, bitácoras, incidencias |
| `revisor2.3` | Revisión y aprobación de bitácoras |
| `beneficiario2.4` | Consulta de sesiones e historial |
| `coord2.5` | Gestión de usuarios, periodos y reportes |
| `integracion` | Flujos completos multi-rol |

---

## Despliegue en producción

| Componente | Plataforma | Configuración |
|-----------|-----------|---------------|
| Backend | **Render** | Root dir: `back` · Build: `npm install && npx prisma generate` · Start: `npm run start` |
| Frontend | **Vercel** | Root dir: `front` · Framework: Vite (autodetectado) |
| Base de datos | **Neon** | Crear proyecto → copiar `DATABASE_URL` → agregar a variables de Render |

Para el manual completo de despliegue paso a paso consulta:
**`docs/SGT_Manual_Instalacion_v1.0.docx`**

---

## Equipo

**AIAS** — Desarrollado como proyecto de ingeniería de software.

| Integrante | Rol en el proyecto |
|-----------|-------------------|
|           |                   |
|           |                   |
|           |                   |
|           |                   |

---

> Para dudas de instalación o despliegue, consulta el manual en `docs/SGT_Manual_Instalacion_v1.0.docx`.
