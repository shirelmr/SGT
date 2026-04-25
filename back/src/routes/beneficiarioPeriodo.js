const express = require('express')
const prisma = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

// GET /api/beneficiario-periodo/mi-progreso  (must be declared before /:id_periodo)
router.get('/mi-progreso', auth, async (req, res) => {
  if (req.user.rol !== 'beneficiario') {
    return res.status(403).json({ error: 'Solo beneficiarios pueden ver su propio progreso' })
  }
  try {
    const benef = await prisma.beneficiario.findUnique({ where: { id_usuario: req.user.id_usuario } })
    if (!benef) return res.status(404).json({ error: 'Perfil de beneficiario no encontrado' })

    const progreso = await prisma.beneficiarioPeriodo.findMany({
      where: { id_benef: benef.id_benef },
      orderBy: { id_benef_periodo: 'desc' },
    })
    res.json(progreso)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// GET /api/beneficiario-periodo/:id_periodo
router.get('/:id_periodo', auth, async (req, res) => {
  const id_periodo = Number(req.params.id_periodo)
  try {
    const registros = await prisma.beneficiarioPeriodo.findMany({
      where: { id_periodo },
      include: {
        beneficiario: {
          include: { usuario: { select: { nombre_completo: true, email: true } } },
        },
      },
    })
    res.json(registros)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// PUT /api/beneficiario-periodo/:id
router.put('/:id', auth, async (req, res) => {
  const id = Number(req.params.id)
  const { pct_examen_inicio, pct_examen_termino, fecha_examen_inicio, fecha_examen_termino } = req.body
  try {
    const registro = await prisma.beneficiarioPeriodo.update({
      where: { id_benef_periodo: id },
      data: {
        ...(pct_examen_inicio !== undefined && { pct_examen_inicio: Number(pct_examen_inicio) }),
        ...(pct_examen_termino !== undefined && { pct_examen_termino: Number(pct_examen_termino) }),
        ...(fecha_examen_inicio !== undefined && { fecha_examen_inicio: new Date(fecha_examen_inicio) }),
        ...(fecha_examen_termino !== undefined && { fecha_examen_termino: new Date(fecha_examen_termino) }),
      },
    })
    res.json(registro)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
