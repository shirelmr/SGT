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

    const periodoActivo = await prisma.periodo.findFirst({ where: { activo: true } })

    const beneficiarios = await prisma.beneficiario.findMany({
      where: { id_tutor: tutor.id_tutor },
      include: {
        usuario: { select: { id_usuario: true, nombre_completo: true, email: true } },
        sesiones: {
          where: { id_tutor: tutor.id_tutor },
          select: { id_sesion: true, fecha: true, estado: true },
          orderBy: { fecha: 'asc' },
        },
        benefef_periodos: {
          where: periodoActivo ? { id_periodo: periodoActivo.id_periodo } : { id_periodo: -1 },
          select: {
            pct_examen_inicio: true,
            pct_examen_termino: true,
            fecha_examen_inicio: true,
            fecha_examen_termino: true,
          },
        },
      },
    })

    const hoy = new Date()

    res.json(beneficiarios.map((b) => {
      const sesiones = b.sesiones
      const realizadas = sesiones.filter((s) => s.estado === 'realizada').length
      const proxima = sesiones
        .filter((s) => s.estado === 'programada' && new Date(s.fecha) >= hoy)
        .sort((a, z) => new Date(a.fecha) - new Date(z.fecha))[0] ?? null
      const ultima = sesiones
        .filter((s) => s.estado === 'realizada')
        .sort((a, z) => new Date(z.fecha) - new Date(a.fecha))[0] ?? null
      const progreso = b.benefef_periodos[0] ?? null

      return {
        id_benef: b.id_benef,
        nombre_completo: b.usuario.nombre_completo,
        email: b.usuario.email,
        escuela: b.escuela,
        grado_escolar: b.grado_escolar,
        nombre_tutor_legal: b.nombre_tutor_legal,
        tel_tutor: b.tel_tutor,
        id_periodo_activo: periodoActivo?.id_periodo ?? null,
        sesiones: {
          total: sesiones.length,
          realizadas,
          proxima: proxima?.fecha ?? null,
          ultima: ultima?.fecha ?? null,
        },
        examen_inicio: progreso?.pct_examen_inicio ?? null,
        examen_termino: progreso?.pct_examen_termino ?? null,
        fecha_examen_inicio: progreso?.fecha_examen_inicio ?? null,
        fecha_examen_termino: progreso?.fecha_examen_termino ?? null,
      }
    }))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
