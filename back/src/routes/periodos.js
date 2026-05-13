const express = require('express')
const prisma = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

const fmt = (p) => ({
  id: p.id_periodo,
  nombre: p.nombre,
  fecha_inicio: p.fecha_inicio,
  fecha_fin: p.fecha_fin,
  activo: p.activo,
  horas_max: p.horas_max,
  horas_esperadas: p.horas_esperadas,
})

// GET /api/periodos
router.get('/', auth, async (req, res) => {
  try {
    const periodos = await prisma.periodo.findMany({ orderBy: { fecha_inicio: 'desc' } })
    res.json(periodos.map(fmt))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/periodos
router.post('/', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Solo coordinadores pueden crear períodos' })
  }
  const { nombre, fecha_inicio, fecha_fin, activo, horas_max, horas_esperadas } = req.body
  if (!nombre || !fecha_inicio || !fecha_fin || horas_max == null || horas_esperadas == null) {
    return res.status(400).json({ error: 'nombre, fecha_inicio, fecha_fin, horas_max y horas_esperadas son requeridos' })
  }
  try {
    await prisma.postulacion.deleteMany({})

    const periodo = await prisma.periodo.create({
      data: {
        nombre,
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin),
        activo: activo ?? false,
        horas_max: Number(horas_max),
        horas_esperadas: Number(horas_esperadas),
      },
    })
    res.status(201).json(fmt(periodo))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// PUT /api/periodos/:id
router.put('/:id', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Solo coordinadores pueden editar períodos' })
  }
  const id = Number(req.params.id)
  const { nombre, fecha_inicio, fecha_fin, activo, horas_max, horas_esperadas } = req.body
  try {
    const periodo = await prisma.periodo.update({
      where: { id_periodo: id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(fecha_inicio !== undefined && { fecha_inicio: new Date(fecha_inicio) }),
        ...(fecha_fin !== undefined && { fecha_fin: new Date(fecha_fin) }),
        ...(activo !== undefined && { activo }),
        ...(horas_max !== undefined && { horas_max: Number(horas_max) }),
        ...(horas_esperadas !== undefined && { horas_esperadas: Number(horas_esperadas) }),
      },
    })
    res.json(fmt(periodo))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// DELETE /api/periodos/:id
router.delete('/:id', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Solo coordinadores pueden eliminar períodos' })
  }
  const id = Number(req.params.id)
  try {
    await prisma.periodo.delete({ where: { id_periodo: id } })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
