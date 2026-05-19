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

      // forzamos a que busque solo las horas del periodo actual del tutor
      if (!id_periodo && tutor.id_periodo) {
        where.id_periodo = tutor.id_periodo
      }
    }

    const horas = await prisma.horasAcreditadas.findMany({
      where,
      include: {
        tutor: { include: { usuario: { select: { nombre_completo: true } } } },
        periodo: { select: { nombre: true, horas_max: true, horas_esperadas: true } },
      },
    })
    res.json(horas)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// PATCH /api/horas-acreditadas/:id/horas-extra
router.patch('/:id/horas-extra', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso denegado' })
  }

  const id = Number(req.params.id)
  const extra = Number(req.body.horas)

  if (isNaN(extra) || extra <= 0) {
    return res.status(400).json({ error: 'horas debe ser un número mayor a 0' })
  }

  try {
    const record = await prisma.horasAcreditadas.findUnique({ where: { id_horas_acreditadas: id } })
    if (!record) return res.status(404).json({ error: 'Registro no encontrado' })

    const updated = await prisma.horasAcreditadas.update({
      where: { id_horas_acreditadas: id },
      data: { horas_extra: Number(record.horas_extra) + extra },
      include: {
        tutor: { include: { usuario: { select: { nombre_completo: true } } } },
        periodo: { select: { nombre: true, horas_max: true, horas_esperadas: true } },
      },
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
