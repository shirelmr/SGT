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
  const { matricula, carrera, semestre, link_zoom } = req.body
  try {
    const perfil = await prisma.tutorTec.update({
      where: { id_usuario: req.user.id_usuario },
      data: {
        ...(matricula !== undefined && { matricula: matricula || null }),
        ...(carrera !== undefined && { carrera: carrera || null }),
        ...(semestre !== undefined && { semestre: semestre ? Number(semestre) : null }),
        ...(link_zoom !== undefined && { link_zoom: link_zoom || null }),
      },
    })
    res.json(perfil)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// GET /api/tutor/mis-beneficiarios
router.get('/mis-beneficiarios', auth, async (req, res) => {
  if (req.user.rol !== 'tutor') {
    return res.status(403).json({ error: 'Acceso denegado' })
  }
  try {
    const tutor = await prisma.tutorTec.findUnique({
      where: { id_usuario: req.user.id_usuario },
    })
    if (!tutor) return res.json([])

    const beneficiarios = await prisma.beneficiario.findMany({
      where: { id_tutor: tutor.id_tutor },
      include: { usuario: { select: { id_usuario: true, nombre_completo: true, email: true } } },
    })

    res.json(beneficiarios.map((b) => ({
      id_benef: b.id_benef,
      id_usuario: b.usuario.id_usuario,
      nombre_completo: b.usuario.nombre_completo,
      email: b.usuario.email,
      escuela: b.escuela,
      grado_escolar: b.grado_escolar,
    })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
