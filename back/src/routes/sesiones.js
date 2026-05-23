const express = require('express')
const prisma = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

const include = {
  tutor: { include: { usuario: { select: { nombre_completo: true } } } },
  beneficiario: { include: { usuario: { select: { nombre_completo: true } } } },
  periodo: { select: { nombre: true, activo: true } },
  bitacora: { select: { id_bitacora: true, estado: true } },
}

function fmtHora(h) {
  if (!h) return null
  if (h instanceof Date) return h.toISOString().slice(11, 16)
  if (typeof h === 'string') return h.slice(0, 5)
  return null
}

const fmt = (s) => ({
  id: s.id_sesion,
  id_tutor: s.id_tutor,
  id_beneficiario: s.id_beneficiario,
  id_periodo: s.id_periodo,
  fecha: s.fecha,
  hora_inicio: fmtHora(s.hora_inicio),
  duracion_hrs: s.duracion_hrs,
  tema: s.tema,
  link_sesion: s.link_sesion,
  estado: s.estado,
  tutor: s.tutor ? { nombre_completo: s.tutor.usuario?.nombre_completo } : null,
  beneficiario: s.beneficiario ? { nombre_completo: s.beneficiario.usuario?.nombre_completo } : null,
  periodo: s.periodo ?? null,
  bitacora: s.bitacora ?? null,
})

// GET /api/sesiones
router.get('/', auth, async (req, res) => {
  const { id_periodo } = req.query
  const where = {}
  if (id_periodo) where.id_periodo = Number(id_periodo)

  try {
    if (req.user.rol === 'tutor') {
      const tutor = await prisma.tutorTec.findUnique({ where: { id_usuario: req.user.id_usuario } })
      if (!tutor) return res.status(404).json({ error: 'Perfil de tutor no encontrado' })
      where.id_tutor = tutor.id_tutor
    } else if (req.user.rol === 'beneficiario') {
      const benef = await prisma.beneficiario.findUnique({ where: { id_usuario: req.user.id_usuario } })
      if (!benef) return res.status(404).json({ error: 'Perfil de beneficiario no encontrado' })
      where.id_beneficiario = benef.id_benef
    }

    const sesiones = await prisma.sesion.findMany({
      where,
      include,
      orderBy: [{ fecha: 'desc' }, { hora_inicio: 'desc' }],
    })
    res.json(sesiones.map(fmt))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// GET /api/sesiones/:id
router.get('/:id', auth, async (req, res) => {
  const id = Number(req.params.id)
  try {
    const sesion = await prisma.sesion.findUnique({ where: { id_sesion: id }, include })
    if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' })
    res.json(fmt(sesion))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/sesiones
router.post('/', auth, async (req, res) => {
  if (req.user.rol !== 'tutor') {
    return res.status(403).json({ error: 'Solo tutores pueden crear sesiones' })
  }
  const { ids_beneficiarios, id_periodo, fecha, hora_inicio, duracion_hrs, tema, estado } = req.body
  if (!ids_beneficiarios || !Array.isArray(ids_beneficiarios) || ids_beneficiarios.length === 0 || !fecha || !hora_inicio || !duracion_hrs || !tema) {
    return res.status(400).json({ error: 'ids_beneficiarios, fecha, hora_inicio, duracion_hrs y tema son requeridos' })
  }

  try {
    const tutor = await prisma.tutorTec.findUnique({ where: { id_usuario: req.user.id_usuario } })
    if (!tutor) return res.status(404).json({ error: 'Perfil de tutor no encontrado' })

    const periodoId = id_periodo ? Number(id_periodo) : tutor.id_periodo

    const sesiones = await Promise.all(
      ids_beneficiarios.map((id_benef) =>
        prisma.sesion.create({
          data: {
            id_tutor: tutor.id_tutor,
            id_beneficiario: Number(id_benef),
            id_periodo: periodoId,
            fecha: new Date(fecha),
            hora_inicio: new Date(`1970-01-01T${hora_inicio}`),
            duracion_hrs: Number(duracion_hrs),
            tema,
            link_sesion: tutor.link_zoom || null,
            estado: estado || 'programada',
          },
          include,
        })
      )
    )
    res.status(201).json(sesiones.map(fmt))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// PUT /api/sesiones/:id
router.put('/:id', auth, async (req, res) => {
  const id = Number(req.params.id)
  const { fecha, hora_inicio, duracion_hrs, tema, link_sesion, estado } = req.body
  try {
    const sesion = await prisma.sesion.update({
      where: { id_sesion: id },
      data: {
        ...(fecha !== undefined && { fecha: new Date(fecha) }),
        ...(hora_inicio !== undefined && { hora_inicio: new Date(`1970-01-01T${hora_inicio}`) }),
        ...(duracion_hrs !== undefined && { duracion_hrs: Number(duracion_hrs) }),
        ...(tema !== undefined && { tema }),
        ...(link_sesion !== undefined && { link_sesion }),
        ...(estado !== undefined && { estado }),
      },
      include,
    })
    res.json(fmt(sesion))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
