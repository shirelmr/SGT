require('dotenv').config({ path: require('path').join(__dirname, './prisma/.env') })

const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./src/routes/auth')
const usuariosRoutes = require('./src/routes/usuarios')
const periodosRoutes = require('./src/routes/periodos')
const sesionesRoutes = require('./src/routes/sesiones')
const bitacorasRoutes = require('./src/routes/bitacoras')
const comentariosRoutes = require('./src/routes/comentarios')
const asistenciasRoutes = require('./src/routes/asistencias')
const horasRoutes = require('./src/routes/horas')
const beneficiarioPeriodoRoutes = require('./src/routes/beneficiarioPeriodo')
const tutorRoutes = require('./src/routes/tutor')
const postulacionesRoutes = require('./src/routes/postulaciones')
const incidenciasRoutes = require('./src/routes/incidencias')
const uploadRoutes = require('./src/routes/upload')

const app = express()

app.use(cors())
app.use(express.json())

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, './uploads')))

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
app.use('/api/incidencias', incidenciasRoutes)
app.use('/api/upload', uploadRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

module.exports = app
