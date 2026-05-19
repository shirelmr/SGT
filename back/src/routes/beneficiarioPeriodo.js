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
    const beneficiarios = await prisma.beneficiario.findMany({
      where: { id_periodo },
      include: {
        usuario: { select: { nombre_completo: true, email: true } },
        tutor: { include: { usuario: { select: { nombre_completo: true } } } },
        sesiones: {
          where: { id_periodo },
          select: { estado: true },
        },
        benefef_periodos: {
          where: { id_periodo },
          take: 1,
        },
      },
    })

    const result = beneficiarios.map((b) => {
      const examen = b.benefef_periodos[0] || null
      const sesiones_total = b.sesiones.length
      const sesiones_realizadas = b.sesiones.filter((s) => s.estado === 'realizada').length
      const sesiones_programadas = b.sesiones.filter((s) => s.estado === 'programada').length
      return {
        id: examen?.id_benef_periodo ?? null,
        id_benef: b.id_benef,
        nombre_completo: b.usuario.nombre_completo,
        email: b.usuario.email,
        tutor: b.tutor?.usuario?.nombre_completo ?? null,
        escuela: b.escuela,
        grado_escolar: b.grado_escolar,
        sesiones_total,
        sesiones_realizadas,
        sesiones_programadas,
        pct_examen_inicio: examen ? Number(examen.pct_examen_inicio) : null,
        pct_examen_termino: examen ? Number(examen.pct_examen_termino) : null,
        fecha_examen_inicio: examen?.fecha_examen_inicio ?? null,
        fecha_examen_termino: examen?.fecha_examen_termino ?? null,
      }
    })

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// PUT /api/beneficiario-periodo/registrar  (upsert by id_benef + id_periodo)
router.put('/registrar', auth, async (req, res) => {
  const { id_benef, id_periodo, pct_examen_inicio, pct_examen_termino, fecha_examen_inicio, fecha_examen_termino } = req.body
  if (!id_benef || !id_periodo) return res.status(400).json({ error: 'id_benef e id_periodo son requeridos' })
  try {
    const data = {
      ...(pct_examen_inicio !== undefined && { pct_examen_inicio: Number(pct_examen_inicio) }),
      ...(pct_examen_termino !== undefined && { pct_examen_termino: Number(pct_examen_termino) }),
      ...(fecha_examen_inicio !== undefined && { fecha_examen_inicio: new Date(fecha_examen_inicio) }),
      ...(fecha_examen_termino !== undefined && { fecha_examen_termino: new Date(fecha_examen_termino) }),
    }
    let registro = await prisma.beneficiarioPeriodo.findFirst({
      where: { id_benef: Number(id_benef), id_periodo: Number(id_periodo) },
    })
    if (registro) {
      registro = await prisma.beneficiarioPeriodo.update({
        where: { id_benef_periodo: registro.id_benef_periodo },
        data,
      })
    } else {
      registro = await prisma.beneficiarioPeriodo.create({
        data: { id_benef: Number(id_benef), id_periodo: Number(id_periodo), ...data },
      })
    }
    res.json(registro)
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
