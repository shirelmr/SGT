const express = require('express')
const prisma = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

const revisorInclude = {
  revisor: { include: { usuario: { select: { nombre_completo: true } } } },
}

const fmt = (c) => ({
  id: c.id_comentario,
  id_bitacora: c.id_bitacora,
  texto: c.comentario,
  estado: c.estado,
  leido: c.leido,
  fecha_creacion: c.fecha_comentario,
  revisor: c.revisor ? { nombre_completo: c.revisor.usuario?.nombre_completo } : null,
})

// GET /api/comentarios/:id_bitacora
router.get('/:id_bitacora', auth, async (req, res) => {
  const id_bitacora = Number(req.params.id_bitacora)
  try {
    const comentarios = await prisma.comentarioBitacora.findMany({
      where: { id_bitacora },
      include: revisorInclude,
      orderBy: { fecha_comentario: 'asc' },
    })
    res.json(comentarios.map(fmt))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/comentarios
router.post('/', auth, async (req, res) => {
  if (req.user.rol !== 'revisor') {
    return res.status(403).json({ error: 'Solo revisores pueden agregar comentarios' })
  }
  const { id_bitacora, comentario, texto, estado } = req.body
  const contenido = texto || comentario
  if (!id_bitacora || !contenido) {
    return res.status(400).json({ error: 'id_bitacora y comentario son requeridos' })
  }

  try {
    const revisor = await prisma.revisor.findUnique({ where: { id_usuario: req.user.id_usuario } })
    if (!revisor) return res.status(404).json({ error: 'Perfil de revisor no encontrado' })

    const nuevo = await prisma.$transaction(async (tx) => {
      // Check for existing approval before creating comment
      const prevAprobado = estado === 'aprobado'
        ? await tx.comentarioBitacora.findFirst({
            where: { id_bitacora: Number(id_bitacora), estado: 'aprobado' },
          })
        : null

      const comment = await tx.comentarioBitacora.create({
        data: {
          id_bitacora: Number(id_bitacora),
          id_revisor: revisor.id_revisor,
          comentario: contenido,
          ...(estado && { estado }),
        },
        include: revisorInclude,
      })

      if (estado === 'aprobado' && !prevAprobado) {
        const bitacora = await tx.bitacora.findUnique({
          where: { id_bitacora: Number(id_bitacora) },
          include: {
            sesion: {
              include: { periodo: { select: { horas_esperadas: true } } },
            },
          },
        })

        if (bitacora?.sesion) {
          const { duracion_hrs, id_tutor, id_periodo } = bitacora.sesion
          const horas_esperadas = Number(bitacora.sesion.periodo?.horas_esperadas ?? 0)

          if (horas_esperadas > 0) {
            const existing = await tx.horasAcreditadas.findUnique({
              where: { id_tutor_id_periodo: { id_tutor, id_periodo } },
            })
            const nuevasImpartidas = Number(existing?.horas_impartidas ?? 0) + Number(duracion_hrs)
            const pct = Math.min((nuevasImpartidas / horas_esperadas) * 100, 100)

            await tx.horasAcreditadas.upsert({
              where: { id_tutor_id_periodo: { id_tutor, id_periodo } },
              create: { id_tutor, id_periodo, horas_impartidas: nuevasImpartidas, porcentaje_acred: pct, horas_extra: 0 },
              update: { horas_impartidas: nuevasImpartidas, porcentaje_acred: pct },
            })
          }

          await tx.bitacora.update({
            where: { id_bitacora: Number(id_bitacora) },
            data: { estado: 'aprobado' },
          })
        }
      }

      return comment
    })

    res.status(201).json(fmt(nuevo))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// PATCH /api/comentarios/:id_bitacora/leidos
router.patch('/:id_bitacora/leidos', auth, async (req, res) => {
  const id_bitacora = Number(req.params.id_bitacora)
  try {
    await prisma.comentarioBitacora.updateMany({
      where: { id_bitacora, leido: false },
      data: { leido: true },
    })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
