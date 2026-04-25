const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../db')

const router = express.Router()

const VALID_ROLES = ['coordinador', 'tutor', 'revisor', 'beneficiario']

function makeToken(user) {
  return jwt.sign(
    { id_usuario: user.id_usuario, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )
}

function fmtUser(user) {
  return {
    id_usuario: user.id_usuario,
    nombre_completo: user.nombre_completo,
    email: user.email,
    rol: user.rol,
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const {
    nombre_completo, email, password, rol,
    // tutor
    matricula, carrera, semestre, link_video,
    // beneficiario
    grado_escolar, escuela, nombre_tutor_legal, tel_tutor,
    // coordinador
    departamento,
  } = req.body

  if (!nombre_completo || !email || !password || !rol) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }
  if (!VALID_ROLES.includes(rol)) {
    return res.status(400).json({ error: `Rol inválido. Valores permitidos: ${VALID_ROLES.join(', ')}` })
  }

  try {
    const existing = await prisma.usuario.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.usuario.create({
        data: { nombre_completo, email, password_hash, rol },
      })

      if (rol === 'coordinador') {
        await tx.coordinador.create({
          data: { id_usuario: u.id_usuario, departamento: departamento || null },
        })
      } else if (rol === 'tutor') {
        await tx.tutorTec.create({
          data: {
            id_usuario: u.id_usuario,
            matricula: matricula || null,
            carrera: carrera || null,
            semestre: semestre ? Number(semestre) : null,
            link_video: link_video || null,
          },
        })
      } else if (rol === 'beneficiario') {
        await tx.beneficiario.create({
          data: {
            id_usuario: u.id_usuario,
            grado_escolar: grado_escolar || null,
            escuela: escuela || null,
            nombre_tutor_legal: nombre_tutor_legal || null,
            tel_tutor: tel_tutor || null,
          },
        })
      } else if (rol === 'revisor') {
        await tx.revisor.create({
          data: {
            id_usuario: u.id_usuario,
            matricula: matricula || null,
            carrera: carrera || null,
            semestre: semestre ? Number(semestre) : null,
          },
        })
      }

      return u
    })

    return res.status(201).json({ token: makeToken(user), user: fmtUser(user) })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' })
  }

  try {
    const user = await prisma.usuario.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    return res.json({ token: makeToken(user), user: fmtUser(user) })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
