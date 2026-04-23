const express = require('express')
const bcrypt = require('bcryptjs')
const prisma = require('../db')

const router = express.Router()

const fmt = (u) => ({
  id: u.id_usuario,
  nombre_completo: u.nombre_completo,
  email: u.email,
  rol: u.rol,
})

// GET /api/usuarios
router.get('/', async (_req, res) => {
  try {
    const users = await prisma.usuario.findMany({
      orderBy: { id_usuario: 'asc' },
    })
    res.json(users.map(fmt))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/usuarios
router.post('/', async (req, res) => {
  const { nombre_completo, email, password, rol, id_periodo, matricula, carrera, semestre, link_video, grado_escolar, escuela, nombre_tutor_legal, tel_tutor, departamento } = req.body

  if (!nombre_completo || !email || !password || !rol) {
    return res.status(400).json({ error: 'Nombre, email, contraseña y rol son obligatorios' })
  }

  try {
    const existing = await prisma.usuario.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'El email ya está registrado' })

    const password_hash = await bcrypt.hash(password, 10)

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.usuario.create({ data: { nombre_completo, email, password_hash, rol } })

      if (rol === 'tutor' && id_periodo) {
        await tx.tutorTec.create({ data: { id_usuario: u.id_usuario, id_periodo: Number(id_periodo), matricula, carrera, semestre: semestre ? Number(semestre) : null, link_video } })
      } else if (rol === 'beneficiario' && id_periodo) {
        await tx.beneficiario.create({ data: { id_usuario: u.id_usuario, id_periodo: Number(id_periodo), grado_escolar, escuela, nombre_tutor_legal, tel_tutor } })
      } else if (rol === 'revisor' && id_periodo) {
        await tx.revisor.create({ data: { id_usuario: u.id_usuario, id_periodo: Number(id_periodo) } })
      } else if (rol === 'coordinador') {
        await tx.coordinador.create({ data: { id_usuario: u.id_usuario, departamento } })
      }

      return u
    })

    res.status(201).json(fmt(user))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// PUT /api/usuarios/:id
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { nombre_completo, email, rol } = req.body

  try {
    const user = await prisma.usuario.update({
      where: { id_usuario: id },
      data: { nombre_completo, email, rol },
    })
    res.json(fmt(user))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// DELETE /api/usuarios/:id
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  try {
    await prisma.usuario.delete({ where: { id_usuario: id } })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
