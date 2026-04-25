const express = require('express')
const prisma = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

// GET /api/tutor/perfil
router.get('/perfil', auth, async (req, res) => {
  if (req.user.rol !== 'tutor') {
    return res.status(403).json({ error: 'Acceso denegado' })
  }
  try {
    const perfil = await prisma.tutorTec.upsert({
      where: { id_usuario: req.user.id_usuario },
      update: {},
      create: { id_usuario: req.user.id_usuario },
    })
    res.json(perfil)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// PUT /api/tutor/perfil
router.put('/perfil', auth, async (req, res) => {
  if (req.user.rol !== 'tutor') {
    return res.status(403).json({ error: 'Acceso denegado' })
  }
  const { matricula, carrera, semestre, link_video } = req.body
  try {
    const perfil = await prisma.tutorTec.update({
      where: { id_usuario: req.user.id_usuario },
      data: {
        ...(matricula !== undefined && { matricula: matricula || null }),
        ...(carrera !== undefined && { carrera: carrera || null }),
        ...(semestre !== undefined && { semestre: semestre ? Number(semestre) : null }),
        ...(link_video !== undefined && { link_video: link_video || null }),
      },
    })
    res.json(perfil)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
