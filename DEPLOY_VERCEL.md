# Deploy a Vercel - Guía Rápida

## Estructura preparada para Vercel ✅

El proyecto ya está configurado para Vercel con:
- `/api/` - Backend como serverless functions
- `/front/` - Frontend React + Vite
- `vercel.json` - Configuración de Vercel
- `.env.example` - Variables de entorno requeridas

## Pasos para deployar:

### 1. **Crear cuenta en Vercel**
- Ve a [vercel.com](https://vercel.com)
- Regístrate con GitHub

### 2. **Push a GitHub (si no está)**
```bash
git add .
git commit -m "Setup para Vercel"
git push origin develop/tutor
```

### 3. **Importar en Vercel**
- En Vercel dashboard → New Project
- Selecciona tu repositorio `SGT`
- **Framework Preset**: Other
- **Root Directory**: `.` (raíz)
- Click "Deploy"

Vercel detectará automáticamente `vercel.json` y `package.json`

### 4. **Configurar variables de entorno en Vercel**

En Vercel Dashboard → Project Settings → Environment Variables

Añade cada una como individual:

```
DATABASE_URL = postgresql://user:pass@host:5432/db
JWT_SECRET = tu_jwt_secreto_aqui
CLOUDINARY_CLOUD_NAME = tu_cloud_name
CLOUDINARY_API_KEY = tu_api_key  
CLOUDINARY_API_SECRET = tu_api_secret
RESEND_API_KEY = tu_resend_key
EMAIL_FROM = noreply@tudominio.com
FRONTEND_URL = https://tu-proyecto.vercel.app
```

Selecciona **Production** para cada una.

### 5. **Redeploy**
- En Vercel Dashboard, click "Redeploy"
- Espera a que termine (~5-10 min)

### 6. **Tu app estará en:**
```
https://tu-proyecto.vercel.app
```

---

## ⚡ Notas importantes

### Estructura de rutas
- **Frontend**: Automáticamente en `/`
- **Backend API**: Automáticamente en `/api/*`
- La reescritura ocurre en serverless functions

### Variables de entorno de demostración
Para una demo rápida, puedes usar datos de prueba o una BD existente que ya tengas configurada.

### Base de datos
Vercel NO proporciona BD. Debe estar en:
- ✅ Supabase (PostgreSQL)
- ✅ Railway PostgreSQL
- ✅ PlanetScale MySQL
- Etc.

### Timeout
- Free tier: 10 segundos máximo
- Sin Gemini, esto es suficiente para demo

---

## 🔄 Desarrollo local

Para continuar desarrollando localmente:
```bash
npm run dev
# Abre: http://localhost:5173 (frontend)
# Backend corre en: http://localhost:3000
```

---

## ❓ Troubleshooting

**Error: "Cannot find module"**
- Vercel necesita `package-lock.json` actualizado
```bash
npm ci
git add package-lock.json
git commit -m "update lock"
git push
```

**Error: "DATABASE_URL not found"**
- Verifica que esté en Vercel Project Settings → Environment Variables
- Las variables deben estar en **Production**

**Frontend no carga**
- Espera a que el build termine (hasta 10 min primera vez)
- Actualiza el navegador (Ctrl+Shift+R)

---

## 📦 Próximos deploys

Cualquier push a tu rama será desplegado automáticamente. Para producción:
1. Push a `main`
2. Vercel automáticamente despliega

Puedes cambiar qué rama se deploya en Project Settings.
