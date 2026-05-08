const express = require('express')
const prisma = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

function fmtHora(h) {
  if (!h) return null
  if (h instanceof Date) return h.toISOString().slice(11, 16)
  if (typeof h === 'string') return h.slice(0, 5)
  return null
}

const baseInclude = {
  sesion: {
    include: {
      tutor: { include: { usuario: { select: { nombre_completo: true } } } },
      beneficiario: { include: { usuario: { select: { nombre_completo: true } } } },
    },
  },
  tutor: { include: { usuario: { select: { nombre_completo: true } } } },
}

const fmt = (b) => ({
  id: b.id_bitacora,
  id_sesion: b.id_sesion,
  id_tutor: b.id_tutor,
  actividades: b.actividades,
  logros: b.logros,
  dificultades: b.dificultades,
  plan_siguiente: b.plan_siguiente,
  evidencia: b.evidencia,
  fecha_registro: b.fecha_registro,
  estado: b.estado,
  sesion: b.sesion ? {
    id_sesion: b.sesion.id_sesion,
    fecha: b.sesion.fecha,
    tema: b.sesion.tema,
    estado: b.sesion.estado,
    hora_inicio: fmtHora(b.sesion.hora_inicio),
    tutor: b.sesion.tutor ? { nombre_completo: b.sesion.tutor.usuario?.nombre_completo } : null,
    beneficiario: b.sesion.beneficiario ? { nombre_completo: b.sesion.beneficiario.usuario?.nombre_completo } : null,
  } : null,
  tutor: b.tutor ? { nombre_completo: b.tutor.usuario?.nombre_completo } : null,
  ...(b.comentarios !== undefined && { comentarios: b.comentarios }),
})

// GET /api/bitacoras
router.get('/', auth, async (req, res) => {
  const { id_periodo } = req.query
  const where = {}

  try {
    if (req.user.rol === 'tutor') {
      const tutor = await prisma.tutorTec.findUnique({ where: { id_usuario: req.user.id_usuario } })
      if (!tutor) return res.status(404).json({ error: 'Perfil de tutor no encontrado' })
      where.id_tutor = tutor.id_tutor
    }
    if (id_periodo) {
      where.sesion = { id_periodo: Number(id_periodo) }
    }

    const bitacoras = await prisma.bitacora.findMany({
      where,
      include: baseInclude,
      orderBy: { fecha_registro: 'desc' },
    })
    res.json(bitacoras.map(fmt))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// GET /api/bitacoras/:id_sesion
router.get('/:id_sesion', auth, async (req, res) => {
  const id_sesion = Number(req.params.id_sesion)
  try {
    const bitacora = await prisma.bitacora.findUnique({
      where: { id_sesion },
      include: {
        ...baseInclude,
        comentarios: {
          include: {
            revisor: { include: { usuario: { select: { nombre_completo: true } } } },
          },
          orderBy: { fecha_comentario: 'asc' },
        },
      },
    })
    if (!bitacora) return res.status(404).json({ error: 'Bitácora no encontrada' })
    res.json(fmt(bitacora))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/bitacoras
router.post('/', auth, async (req, res) => {
  if (req.user.rol !== 'tutor') {
    return res.status(403).json({ error: 'Solo tutores pueden crear bitácoras' })
  }
  const { id_sesion, actividades, logros, dificultades, plan_siguiente, evidencia } = req.body
  if (!id_sesion) return res.status(400).json({ error: 'id_sesion es requerido' })

  try {
    const tutor = await prisma.tutorTec.findUnique({ where: { id_usuario: req.user.id_usuario } })
    if (!tutor) return res.status(404).json({ error: 'Perfil de tutor no encontrado' })

    const bitacora = await prisma.$transaction(async (tx) => {
      const b = await tx.bitacora.create({
        data: {
          id_sesion: Number(id_sesion),
          id_tutor: tutor.id_tutor,
          actividades,
          logros,
          dificultades,
          plan_siguiente,
          evidencia,
        },
        include: baseInclude,
      })
      await tx.sesion.update({
        where: { id_sesion: Number(id_sesion) },
        data: { estado: 'realizada' },
      })
      return b
    })

    res.status(201).json(fmt(bitacora))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// PUT /api/bitacoras/:id
router.put('/:id', auth, async (req, res) => {
  const id = Number(req.params.id)
  const { actividades, logros, dificultades, plan_siguiente, evidencia, estado } = req.body
  try {
    const bitacora = await prisma.bitacora.update({
      where: { id_bitacora: parseInt(id) },
      data: {
        ...(actividades !== undefined && { actividades }),
        ...(logros !== undefined && { logros }),
        ...(dificultades !== undefined && { dificultades }),
        ...(plan_siguiente !== undefined && { plan_siguiente }),
        ...(evidencia !== undefined && { evidencia }),
        ...(estado !== undefined && { estado }),
      },
      include: baseInclude,
    })
    res.json(fmt(bitacora))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
