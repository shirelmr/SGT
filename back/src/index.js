require('dotenv').config({ path: require('path').join(__dirname, '../prisma/.env') })

const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const usuariosRoutes = require('./routes/usuarios')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/usuarios', usuariosRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
