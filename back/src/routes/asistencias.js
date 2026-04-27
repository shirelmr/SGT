const express = require('express')
const prisma = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

// GET /api/asistencias/:id_sesion
router.get('/:id_sesion', auth, async (req, res) => {
  const id_sesion = Number(req.params.id_sesion)
  try {
    const asistencia = await prisma.asistencia.findUnique({ where: { id_sesion } })
    res.json(asistencia ?? { id_sesion, confirma_tutor: false, confirma_benef: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/asistencias/:id_sesion/confirmar
router.post('/:id_sesion/confirmar', auth, async (req, res) => {
  const { rol } = req.user
  if (rol !== 'tutor' && rol !== 'beneficiario') {
    return res.status(403).json({ error: 'Solo tutores o beneficiarios pueden confirmar asistencia' })
  }

  const id_sesion = Number(req.params.id_sesion)
  const data = rol === 'tutor'
    ? { confirma_tutor: true, fecha_conf_tutor: new Date() }
    : { confirma_benef: true, fecha_conf_benef: new Date() }

  try {
    const asistencia = await prisma.asistencia.upsert({
      where: { id_sesion },
      update: data,
      create: { id_sesion, ...data },
    })
    res.json(asistencia)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/asistencias/:id_sesion/cancelar
router.post('/:id_sesion/cancelar', auth, async (req, res) => {
  const { rol } = req.user
  if (rol !== 'beneficiario') {
    return res.status(403).json({ error: 'Solo beneficiarios pueden cancelar su asistencia' })
  }

  const id_sesion = Number(req.params.id_sesion)

  try {
    const asistencia = await prisma.asistencia.upsert({
      where: { id_sesion },
      update: { confirma_benef: false, fecha_conf_benef: null },
      create: { id_sesion, confirma_benef: false },
    })
    res.json(asistencia)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router