const express = require('express')
const prisma = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

// GET /api/incidencias/sesiones-sin-bitacora?id_periodo=X
router.get('/sesiones-sin-bitacora', auth, async (req, res) => {
  const { id_periodo } = req.query
  const where = {
    incidencias: { some: {} },
    bitacora: { is: null },
  }
  if (id_periodo) where.id_periodo = Number(id_periodo)

  try {
    const sesiones = await prisma.sesion.findMany({
      where,
      include: {
        tutor: { include: { usuario: { select: { nombre_completo: true } } } },
        beneficiario: { include: { usuario: { select: { nombre_completo: true } } } },
        incidencias: { orderBy: { fecha_registro: 'desc' } },
      },
      orderBy: { fecha: 'desc' },
    })

    res.json(sesiones.map((s) => ({
      id_sesion: s.id_sesion,
      id_tutor: s.id_tutor,
      fecha: s.fecha,
      hora_inicio: s.hora_inicio,
      duracion_hrs: s.duracion_hrs,
      tema: s.tema,
      estado: s.estado,
      tutor: s.tutor ? { nombre_completo: s.tutor.usuario?.nombre_completo } : null,
      beneficiario: s.beneficiario ? { nombre_completo: s.beneficiario.usuario?.nombre_completo } : null,
      incidencias: s.incidencias,
    })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// GET /api/incidencias/sesion/:id_sesion
router.get('/sesion/:id_sesion', auth, async (req, res) => {
  const id_sesion = Number(req.params.id_sesion)
  try {
    const incidencias = await prisma.incidencia.findMany({
      where: { id_sesion },
      orderBy: { fecha_registro: 'desc' },
    })
    res.json(incidencias)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/incidencias
router.post('/', auth, async (req, res) => {
  if (req.user.rol !== 'tutor') {
    return res.status(403).json({ error: 'Solo tutores pueden registrar incidencias' })
  }
  const { id_sesion, tipo, descripcion } = req.body
  if (!id_sesion || !tipo) {
    return res.status(400).json({ error: 'id_sesion y tipo son requeridos' })
  }
  try {
    const tutor = await prisma.tutorTec.findUnique({ where: { id_usuario: req.user.id_usuario } })
    if (!tutor) return res.status(404).json({ error: 'Perfil de tutor no encontrado' })

    const incidencia = await prisma.incidencia.create({
      data: {
        id_sesion: Number(id_sesion),
        id_tutor: tutor.id_tutor,
        tipo,
        descripcion: descripcion || null,
      },
    })
    res.status(201).json(incidencia)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
