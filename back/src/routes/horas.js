const express = require('express')
const prisma = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

// GET /api/horas-acreditadas
router.get('/', auth, async (req, res) => {
  const { id_periodo } = req.query
  const where = {}
  if (id_periodo) where.id_periodo = Number(id_periodo)

  try {
    if (req.user.rol === 'tutor') {
      const tutor = await prisma.tutorTec.findUnique({ where: { id_usuario: req.user.id_usuario } })
      if (!tutor) return res.status(404).json({ error: 'Perfil de tutor no encontrado' })
      where.id_tutor = tutor.id_tutor
    }

    const horas = await prisma.horasAcreditadas.findMany({
      where,
      include: {
        tutor: { include: { usuario: { select: { nombre_completo: true } } } },
        periodo: { select: { nombre: true, horas_max: true } },
      },
    })
    res.json(horas)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
