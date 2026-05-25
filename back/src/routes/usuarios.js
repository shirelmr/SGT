const express = require('express')
const bcrypt = require('bcryptjs')
const prisma = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

const fmt = (u) => {
  const base = { id: u.id_usuario, nombre_completo: u.nombre_completo, email: u.email, rol: u.rol }
  if (u.tutor) return { ...base, id_tutor: u.tutor.id_tutor, id_periodo: u.tutor.id_periodo, id_revisor: u.tutor.id_revisor, matricula: u.tutor.matricula, carrera: u.tutor.carrera, semestre: u.tutor.semestre }
  if (u.beneficiario) return { ...base, id_periodo: u.beneficiario.id_periodo, id_tutor: u.beneficiario.id_tutor, grado_escolar: u.beneficiario.grado_escolar, escuela: u.beneficiario.escuela, nombre_tutor_legal: u.beneficiario.nombre_tutor_legal, tel_tutor: u.beneficiario.tel_tutor }
  if (u.revisor) return { ...base, id_revisor: u.revisor.id_revisor, id_periodo: u.revisor.id_periodo, matricula: u.revisor.matricula, carrera: u.revisor.carrera, semestre: u.revisor.semestre }
  if (u.coordinador) return { ...base, departamento: u.coordinador.departamento }
  return base
}

// GET /api/usuarios
router.get('/', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso denegado' })
  }

  const { rol, todos, id_periodo } = req.query

  try {
    const periodoActivo = await prisma.periodo.findFirst({ where: { activo: true } })
    const activeId = periodoActivo?.id_periodo

    let allRoleConditions

    if (id_periodo) {
      const pid = Number(id_periodo)
      allRoleConditions = [
        { rol: 'coordinador' },
        { rol: 'tutor', tutor: { id_periodo: pid } },
        { rol: 'revisor', revisor: { id_periodo: pid } },
        { rol: 'beneficiario', beneficiario: { id_periodo: pid } },
      ]
    } else if (todos === 'true' && activeId) {
      allRoleConditions = [
        { rol: 'tutor', tutor: { OR: [{ id_periodo: { not: activeId } }, { id_periodo: null }] } },
        { rol: 'revisor', revisor: { OR: [{ id_periodo: { not: activeId } }, { id_periodo: null }] } },
        { rol: 'beneficiario', beneficiario: { OR: [{ id_periodo: { not: activeId } }, { id_periodo: null }] } },
      ]
    } else {
      allRoleConditions = [
        { rol: 'coordinador' },
        activeId ? { rol: 'tutor', tutor: { id_periodo: activeId } } : { rol: 'tutor' },
        activeId ? { rol: 'revisor', revisor: { id_periodo: activeId } } : { rol: 'revisor' },
        activeId ? { rol: 'beneficiario', beneficiario: { id_periodo: activeId } } : { rol: 'beneficiario' },
      ]
    }

    const OR = rol ? allRoleConditions.filter((c) => c.rol === rol) : allRoleConditions

    const users = await prisma.usuario.findMany({
      where: { id_usuario: { not: req.user.id_usuario }, OR },
      orderBy: { id_usuario: 'asc' },
      include: { tutor: true, beneficiario: true, revisor: true, coordinador: true },
    })

    res.json(users.map(fmt))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// GET /api/usuarios/:id/resumen
router.get('/:id/resumen', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') return res.status(403).json({ error: 'Acceso denegado' })

  const id = Number(req.params.id)
  const periodoId = req.query.id_periodo ? Number(req.query.id_periodo) : null

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: id },
      include: { tutor: true, beneficiario: true, revisor: true, coordinador: true },
    })
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    const pid = periodoId
      || usuario.tutor?.id_periodo
      || usuario.beneficiario?.id_periodo
      || usuario.revisor?.id_periodo
      || null

    let stats = {}
    let tutorAsignado = null

    if (usuario.rol === 'tutor' && usuario.tutor) {
      const tutorId = usuario.tutor.id_tutor
      const whereSession = { id_tutor: tutorId, ...(pid ? { id_periodo: pid } : {}) }

      const [sesiones, horas] = await Promise.all([
        prisma.sesion.findMany({
          where: whereSession,
          include: { bitacora: { select: { estado: true } } },
        }),
        pid
          ? prisma.horasAcreditadas.findUnique({
              where: { id_tutor_id_periodo: { id_tutor: tutorId, id_periodo: pid } },
            })
          : Promise.resolve(null),
      ])

      const bitacoras = sesiones.flatMap((s) => (s.bitacora ? [s.bitacora] : []))
      stats = {
        sesiones_total: sesiones.length,
        sesiones_realizadas: sesiones.filter((s) => s.estado === 'realizada').length,
        sesiones_programadas: sesiones.filter((s) => s.estado === 'programada').length,
        bitacoras_total: bitacoras.length,
        bitacoras_aprobadas: bitacoras.filter((b) => b.estado === 'aprobado' || b.estado === 'aprobado_sin_horas').length,
        bitacoras_pendientes: bitacoras.filter((b) => b.estado === 'pendiente').length,
        bitacoras_no_aprobadas: bitacoras.filter((b) => b.estado === 'no_aprobada').length,
        horas_impartidas: Number(horas?.horas_impartidas ?? 0),
        horas_extra: Number(horas?.horas_extra ?? 0),
        porcentaje_acred: Number(horas?.porcentaje_acred ?? 0),
      }
    } else if (usuario.rol === 'beneficiario' && usuario.beneficiario) {
      const benefId = usuario.beneficiario.id_benef
      const sesiones = await prisma.sesion.findMany({
        where: { id_beneficiario: benefId, ...(pid ? { id_periodo: pid } : {}) },
      })
      stats = {
        sesiones_total: sesiones.length,
        sesiones_realizadas: sesiones.filter((s) => s.estado === 'realizada').length,
        sesiones_programadas: sesiones.filter((s) => s.estado === 'programada').length,
      }

      if (usuario.beneficiario.id_tutor) {
        const tutorRec = await prisma.tutorTec.findUnique({
          where: { id_tutor: usuario.beneficiario.id_tutor },
          include: { usuario: { select: { nombre_completo: true } } },
        })
        tutorAsignado = tutorRec?.usuario?.nombre_completo || null
      }
    } else if (usuario.rol === 'revisor' && usuario.revisor) {
      const revisorId = usuario.revisor.id_revisor
      const periodoFilter = pid ? { sesion: { id_periodo: pid } } : {}

      const [total, aprobadas] = await Promise.all([
        prisma.bitacora.count({
          where: { comentarios: { some: { id_revisor: revisorId } }, ...periodoFilter },
        }),
        prisma.bitacora.count({
          where: { estado: 'aprobado', comentarios: { some: { id_revisor: revisorId } }, ...periodoFilter },
        }),
      ])
      stats = { bitacoras_revisadas: total, bitacoras_aprobadas: aprobadas }
    }

    const perfil = usuario.tutor || usuario.beneficiario || usuario.revisor || usuario.coordinador || null

    res.json({
      id: usuario.id_usuario,
      nombre_completo: usuario.nombre_completo,
      email: usuario.email,
      rol: usuario.rol,
      perfil,
      tutor_asignado: tutorAsignado,
      stats,
    })
  } catch (err) {
    console.error('[resumen error]', err)
    res.status(500).json({ error: 'Error interno del servidor', detail: err.message })
  }
})

// POST /api/usuarios
router.post('/', async (req, res) => {
  const { nombre_completo, email, password, rol, id_periodo, matricula, carrera, semestre, grado_escolar, escuela, nombre_tutor_legal, tel_tutor, departamento } = req.body

  if (!nombre_completo || !email || !password || !rol) {
    return res.status(400).json({ error: 'Nombre, email, contraseña y rol son obligatorios' })
  }

  try {
    const existing = await prisma.usuario.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'El email ya está registrado' })

    const password_hash = await bcrypt.hash(password, 10)

    const user = await prisma.$transaction(async (tx) => {
      const periodoActivo = await tx.periodo.findFirst({ where: { activo: true } })
      const finalPeriodoId = id_periodo ? Number(id_periodo) : (periodoActivo?.id_periodo || null)
      const u = await tx.usuario.create({ data: { nombre_completo, email, password_hash, rol } })

      if (rol === 'tutor') {
        const tutor = await tx.tutorTec.create({
          data: {
            id_usuario: u.id_usuario,
            id_periodo: finalPeriodoId,
            matricula: matricula || null,
            carrera: carrera || null,
            semestre: semestre ? Number(semestre) : null,
          },
        })
        if (tutor.id_periodo) {
          await tx.horasAcreditadas.upsert({
            where: { id_tutor_id_periodo: { id_tutor: tutor.id_tutor, id_periodo: tutor.id_periodo } },
            create: { id_tutor: tutor.id_tutor, id_periodo: tutor.id_periodo, horas_impartidas: 0, porcentaje_acred: 0, horas_extra: 0 },
            update: {},
          })
        }
      } else if (rol === 'beneficiario') {
        await tx.beneficiario.create({
          data: {
            id_usuario: u.id_usuario,
            id_periodo: finalPeriodoId,
            grado_escolar: grado_escolar || null,
            escuela: escuela || null,
            nombre_tutor_legal: nombre_tutor_legal || null,
            tel_tutor: tel_tutor || null,
          },
        })
      } else if (rol === 'revisor') {
        await tx.revisor.create({
          data: {
            id_usuario: u.id_usuario,
            id_periodo: id_periodo ? Number(id_periodo) : null,
            matricula: matricula || null,
            carrera: carrera || null,
            semestre: semestre ? Number(semestre) : null,
          },
        })
      } else if (rol === 'coordinador') {
        await tx.coordinador.create({ data: { id_usuario: u.id_usuario, departamento: departamento || null } })
      }

      return u
    })

    res.status(201).json(fmt(user))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/usuarios/asignar-automatico
router.post('/asignar-automatico', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso denegado' })
  }

  const n = Number(req.body.beneficiarios_por_tutor)
  if (!n || n < 1) {
    return res.status(400).json({ error: 'beneficiarios_por_tutor debe ser mayor a 0' })
  }

  try {
    const periodo = await prisma.periodo.findFirst({ where: { activo: true } })
    if (!periodo) return res.status(400).json({ error: 'No hay periodo activo' })

    const tutores = await prisma.tutorTec.findMany({ where: { id_periodo: periodo.id_periodo } })
    if (tutores.length === 0) return res.status(400).json({ error: 'No hay tutores en el periodo activo' })

    const beneficiarios = await prisma.beneficiario.findMany({
      where: { id_periodo: periodo.id_periodo, id_tutor: null },
    })

    if (beneficiarios.length === 0) return res.json({ asignados: 0 })

    const toAssign = beneficiarios.slice(0, tutores.length * n)

    await prisma.$transaction(
      toAssign.map((b, i) =>
        prisma.beneficiario.update({
          where: { id_benef: b.id_benef },
          data: { id_tutor: tutores[Math.floor(i / n)].id_tutor },
        })
      )
    )

    res.json({ asignados: toAssign.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/usuarios/asignar-revisores-automatico
router.post('/asignar-revisores-automatico', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso denegado' })
  }

  const n = Number(req.body.tutores_por_revisor)
  if (!n || n < 1) {
    return res.status(400).json({ error: 'tutores_por_revisor debe ser mayor a 0' })
  }

  try {
    const periodo = await prisma.periodo.findFirst({ where: { activo: true } })
    if (!periodo) return res.status(400).json({ error: 'No hay periodo activo' })

    const revisores = await prisma.revisor.findMany({ where: { id_periodo: periodo.id_periodo } })
    if (revisores.length === 0) return res.status(400).json({ error: 'No hay revisores en el periodo activo' })

    const tutores = await prisma.tutorTec.findMany({
      where: { id_periodo: periodo.id_periodo, id_revisor: null },
    })

    if (tutores.length === 0) return res.json({ asignados: 0 })

    const toAssign = tutores.slice(0, revisores.length * n)

    await prisma.$transaction(
      toAssign.map((t, i) =>
        prisma.tutorTec.update({
          where: { id_tutor: t.id_tutor },
          data: { id_revisor: revisores[Math.floor(i / n)].id_revisor },
        })
      )
    )

    res.json({ asignados: toAssign.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// PUT /api/usuarios/:id
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { nombre_completo, email, rol, id_periodo, matricula, carrera, semestre, id_tutor, id_revisor, grado_escolar, escuela, nombre_tutor_legal, tel_tutor, departamento } = req.body

  try {
    const result = await prisma.$transaction(async (tx) => {
      //obtener rol actual
      const currentUser = await tx.usuario.findUnique({ where: { id_usuario: id } })
      if (!currentUser) throw new Error('Usuario no encontrado')

      const finalRol = rol || currentUser.rol

      await tx.usuario.update({
        where: { id_usuario: id },
        data: { nombre_completo, email, rol },
      })

      const pid = id_periodo !== undefined ? (id_periodo ? Number(id_periodo) : null) : undefined

      if (finalRol === 'tutor') {
        const tutor = await tx.tutorTec.update({
          where: { id_usuario: id },
          data: {
            id_periodo: pid,
            id_revisor: id_revisor !== undefined ? (id_revisor ? Number(id_revisor) : null) : undefined,
            matricula,
            carrera,
            semestre: semestre !== undefined ? (semestre ? Number(semestre) : null) : undefined,
          }
        })
        if (pid) {
          await tx.horasAcreditadas.upsert({
            where: { id_tutor_id_periodo: { id_tutor: tutor.id_tutor, id_periodo: pid } },
            create: { id_tutor: tutor.id_tutor, id_periodo: pid, horas_impartidas: 0, porcentaje_acred: 0, horas_extra: 0 },
            update: {},
          })
        }
      } else if (finalRol === 'beneficiario') {
        await tx.beneficiario.update({
          where: { id_usuario: id },
          data: {
            id_periodo: pid,
            id_tutor: id_tutor !== undefined ? (id_tutor ? Number(id_tutor) : null) : undefined,
            grado_escolar,
            escuela,
            nombre_tutor_legal,
            tel_tutor
          }
        })
      } else if (finalRol === 'revisor') {
        await tx.revisor.update({
          where: { id_usuario: id },
          data: {
            id_periodo: pid,
            matricula,
            carrera,
            semestre: semestre !== undefined ? (semestre ? Number(semestre) : null) : undefined
          }
        })
      } else if (finalRol === 'coordinador') {
        await tx.coordinador.update({
          where: { id_usuario: id },
          data: { departamento }
        })
      }

      return await tx.usuario.findUnique({
        where: { id_usuario: id },
        include: { tutor: true, beneficiario: true, revisor: true, coordinador: true },
      })
    })
    
    res.json(fmt(result))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/usuarios/:id/alta  — move beneficiario into the current active period
router.post('/:id/alta', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso denegado' })
  }
  const id = Number(req.params.id)
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: id },
      include: { beneficiario: true },
    })
    if (!usuario?.beneficiario) {
      return res.status(404).json({ error: 'Beneficiario no encontrado' })
    }

    const periodoActivo = await prisma.periodo.findFirst({ where: { activo: true } })
    if (!periodoActivo) {
      return res.status(400).json({ error: 'No hay periodo activo' })
    }

    await prisma.beneficiario.update({
      where: { id_usuario: id },
      data: { id_periodo: periodoActivo.id_periodo },
    })

    res.json({ ok: true, id_periodo: periodoActivo.id_periodo })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/usuarios/:id/baja  — remove beneficiario from current period, move to previous one
router.post('/:id/baja', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso denegado' })
  }
  const id = Number(req.params.id)
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: id },
      include: { beneficiario: true },
    })
    if (!usuario?.beneficiario) {
      return res.status(404).json({ error: 'Beneficiario no encontrado' })
    }

    const currentPeriodoId = usuario.beneficiario.id_periodo
    let previousPeriodoId = null

    if (currentPeriodoId) {
      const prev = await prisma.periodo.findFirst({
        where: { id_periodo: { lt: currentPeriodoId } },
        orderBy: { id_periodo: 'desc' },
      })
      previousPeriodoId = prev?.id_periodo ?? null
    }

    await prisma.beneficiario.update({
      where: { id_usuario: id },
      data: { id_periodo: previousPeriodoId, id_tutor: null },
    })

    res.json({ ok: true, id_periodo: previousPeriodoId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// DELETE /api/usuarios/:id
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  try {
    await prisma.usuario.delete({ where: { id_usuario: id } })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
