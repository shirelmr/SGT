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
    duracion_hrs: b.sesion.duracion_hrs,
    tutor: b.sesion.tutor ? { nombre_completo: b.sesion.tutor.usuario?.nombre_completo } : null,
    beneficiario: b.sesion.beneficiario ? { nombre_completo: b.sesion.beneficiario.usuario?.nombre_completo } : null,
  } : null,
  tutor: b.tutor ? { nombre_completo: b.tutor.usuario?.nombre_completo } : null,
  ...(b.comentarios !== undefined && { comentarios: b.comentarios }),
})

// POST /api/bitacoras/sin-bitacora  (revisor only — creates a minimal review record for sessions without a bitácora)
router.post('/sin-bitacora', auth, async (req, res) => {
  if (req.user.rol !== 'revisor') {
    return res.status(403).json({ error: 'Solo revisores pueden usar este endpoint' })
  }
  const { id_sesion, estado } = req.body
  if (!id_sesion || !estado) {
    return res.status(400).json({ error: 'id_sesion y estado son requeridos' })
  }
  try {
    const sesion = await prisma.sesion.findUnique({
      where: { id_sesion: Number(id_sesion) },
      include: { periodo: { select: { horas_esperadas: true } } },
    })
    if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' })

    const bitacora = await prisma.$transaction(async (tx) => {
      const b = await tx.bitacora.create({
        data: { id_sesion: Number(id_sesion), id_tutor: sesion.id_tutor, estado },
        include: baseInclude,
      })

      // Si se crea directamente como aprobado, acreditar horas igual que en el PUT
      if (estado === 'aprobado') {
        const { duracion_hrs, id_tutor, id_periodo, id_grupo_sesion } = sesion
        const horas_esperadas = Number(sesion.periodo?.horas_esperadas ?? 0)

        if (horas_esperadas > 0) {
          // Solo acredita si ninguna otra sesión del grupo ya tiene bitácora aprobada
          const otrasAprobadas = id_grupo_sesion
            ? await tx.bitacora.count({
                where: {
                  sesion: { id_grupo_sesion },
                  estado: 'aprobado',
                },
              })
            : 0

          if (otrasAprobadas === 0) {
            const existing = await tx.horasAcreditadas.findUnique({
              where: { id_tutor_id_periodo: { id_tutor, id_periodo } },
            })
            const nuevasImpartidas = Number(existing?.horas_impartidas ?? 0) + Number(duracion_hrs)
            const horasExtra = Number(existing?.horas_extra ?? 0)
            const pct = Math.min(((nuevasImpartidas + horasExtra) / horas_esperadas) * 100, 100)

            await tx.horasAcreditadas.upsert({
              where: { id_tutor_id_periodo: { id_tutor, id_periodo } },
              create: { id_tutor, id_periodo, horas_impartidas: nuevasImpartidas, porcentaje_acred: pct, horas_extra: 0 },
              update: { horas_impartidas: nuevasImpartidas, porcentaje_acred: pct },
            })
          }
        }
      }

      return b
    })

    res.status(201).json(fmt(bitacora))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
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
    if (req.user.rol === 'revisor') {
      const revisor = await prisma.revisor.findUnique({ where: { id_usuario: req.user.id_usuario } })
      if (!revisor) return res.status(404).json({ error: 'Perfil de revisor no encontrado' })
      where.tutor = { id_revisor: revisor.id_revisor }
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
    const result = await prisma.$transaction(async (tx) => {
      // Solo tocar horas si el estado cambia (y el nuevo estado afecta horas)
      const estadoCambia = estado !== undefined
      if (estadoCambia) {
        const current = await tx.bitacora.findUnique({
          where: { id_bitacora: id },
          include: {
            sesion: { include: { periodo: { select: { horas_esperadas: true } } } },
          },
        })

        if (current && current.sesion && current.estado !== estado) {
          const { duracion_hrs, id_tutor, id_periodo } = current.sesion
          const horas_esperadas = Number(current.sesion.periodo?.horas_esperadas ?? 0)

          if (horas_esperadas > 0) {
            const existing = await tx.horasAcreditadas.findUnique({
              where: { id_tutor_id_periodo: { id_tutor, id_periodo } },
            })
            const actuales = Number(existing?.horas_impartidas ?? 0)
            const horasExtra = Number(existing?.horas_extra ?? 0)
            let nuevasImpartidas = actuales

            // Verifica si otra sesión del mismo grupo ya tiene bitácora aprobada
            const otrasAprobadas = current.sesion.id_grupo_sesion
              ? await tx.bitacora.count({
                  where: {
                    id_bitacora: { not: id },
                    sesion: { id_grupo_sesion: current.sesion.id_grupo_sesion },
                    estado: 'aprobado',
                  },
                })
              : 0

            // aprobado → otro: descontar horas solo si no quedan otras aprobadas en el grupo
            if (current.estado === 'aprobado' && estado !== 'aprobado') {
              if (otrasAprobadas === 0) {
                nuevasImpartidas = Math.max(0, actuales - Number(duracion_hrs))
              }
            }
            // otro → aprobado: sumar horas solo si es la primera aprobada en el grupo
            if (current.estado !== 'aprobado' && estado === 'aprobado') {
              if (otrasAprobadas === 0) {
                nuevasImpartidas = actuales + Number(duracion_hrs)
              }
            }

            if (nuevasImpartidas !== actuales) {
              const pct = Math.min(((nuevasImpartidas + horasExtra) / horas_esperadas) * 100, 100)
              await tx.horasAcreditadas.upsert({
                where: { id_tutor_id_periodo: { id_tutor, id_periodo } },
                create: { id_tutor, id_periodo, horas_impartidas: nuevasImpartidas, porcentaje_acred: pct, horas_extra: 0 },
                update: { horas_impartidas: nuevasImpartidas, porcentaje_acred: pct },
              })
            }
          }
        }
      }

      return tx.bitacora.update({
        where: { id_bitacora: id },
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
    })

    res.json(fmt(result))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
