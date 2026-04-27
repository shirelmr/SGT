require('dotenv').config({ path: require('path').join(__dirname, '../prisma/.env') })

const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/auth')
const usuariosRoutes = require('./routes/usuarios')
const periodosRoutes = require('./routes/periodos')
const sesionesRoutes = require('./routes/sesiones')
const bitacorasRoutes = require('./routes/bitacoras')
const comentariosRoutes = require('./routes/comentarios')
const asistenciasRoutes = require('./routes/asistencias')
const horasRoutes = require('./routes/horas')
const beneficiarioPeriodoRoutes = require('./routes/beneficiarioPeriodo')
const tutorRoutes = require('./routes/tutor')
const postulacionesRoutes = require('./routes/postulaciones')

const app = express()

app.use(cors())
app.use(express.json())

// Serve uploaded files (Duolingo screenshots, etc.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/periodos', periodosRoutes)
app.use('/api/sesiones', sesionesRoutes)
app.use('/api/bitacoras', bitacorasRoutes)
app.use('/api/comentarios', comentariosRoutes)
app.use('/api/asistencias', asistenciasRoutes)
app.use('/api/horas-acreditadas', horasRoutes)
app.use('/api/beneficiario-periodo', beneficiarioPeriodoRoutes)
app.use('/api/tutor', tutorRoutes)
app.use('/api/postulaciones', postulacionesRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
