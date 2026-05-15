const express = require('express')
const bcrypt = require('bcryptjs')
const prisma = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

const fmt = (u) => {
  const base = { id: u.id_usuario, nombre_completo: u.nombre_completo, email: u.email, rol: u.rol }
  if (u.tutor) return { ...base, id_tutor: u.tutor.id_tutor, id_periodo: u.tutor.id_periodo, matricula: u.tutor.matricula, carrera: u.tutor.carrera, semestre: u.tutor.semestre, link_video: u.tutor.link_video }
  if (u.beneficiario) return { ...base, id_periodo: u.beneficiario.id_periodo, id_tutor: u.beneficiario.id_tutor, grado_escolar: u.beneficiario.grado_escolar, escuela: u.beneficiario.escuela, nombre_tutor_legal: u.beneficiario.nombre_tutor_legal, tel_tutor: u.beneficiario.tel_tutor }
  if (u.revisor) return { ...base, id_periodo: u.revisor.id_periodo, matricula: u.revisor.matricula, carrera: u.revisor.carrera, semestre: u.revisor.semestre }
  if (u.coordinador) return { ...base, departamento: u.coordinador.departamento }
  return base
}

// GET /api/usuarios
router.get('/', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso denegado' })
  }

  const { rol, todos } = req.query

  try {
    const periodoActivo = await prisma.periodo.findFirst({ where: { activo: true } })
    const activeId = periodoActivo?.id_periodo

    let allRoleConditions;

    if (todos === 'true' && activeId) {
      // mostrar inactivos: Roles que NO están en el periodo actual o no tienen uno
      allRoleConditions = [
        { rol: 'tutor', tutor: { OR: [{ id_periodo: { not: activeId } }, { id_periodo: null }] } },
        { rol: 'revisor', revisor: { OR: [{ id_periodo: { not: activeId } }, { id_periodo: null }] } },
        { rol: 'beneficiario', beneficiario: { OR: [{ id_periodo: { not: activeId } }, { id_periodo: null }] } },
      ]
    } else {
      // vista normal: Coordinadores + usuarios del periodo activo
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

// POST /api/usuarios
router.post('/', async (req, res) => {
  const { nombre_completo, email, password, rol, id_periodo, matricula, carrera, semestre, link_video, grado_escolar, escuela, nombre_tutor_legal, tel_tutor, departamento } = req.body

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
            link_video: link_video || null,
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
            id_periodo: id_periodo ? Number(id_periodo) : null,
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

// PUT /api/usuarios/:id
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { nombre_completo, email, rol, id_periodo, matricula, carrera, semestre, link_video, id_tutor, grado_escolar, escuela, nombre_tutor_legal, tel_tutor, departamento } = req.body

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar usuario base
      await tx.usuario.update({
        where: { id_usuario: id },
        data: { nombre_completo, email, rol },
      })

      const pid = id_periodo ? Number(id_periodo) : null

      // 2. Actualizar el perfil específico y asignarle el nuevo periodo
      if (rol === 'tutor') {
        const tutor = await tx.tutorTec.update({
          where: { id_usuario: id },
          data: { id_periodo: pid, matricula, carrera, semestre: semestre ? Number(semestre) : null, link_video }
        })
        // Si lo renovaron a un nuevo periodo, inicializamos sus horas en 0
        if (pid) {
          await tx.horasAcreditadas.upsert({
            where: { id_tutor_id_periodo: { id_tutor: tutor.id_tutor, id_periodo: pid } },
            create: { id_tutor: tutor.id_tutor, id_periodo: pid, horas_impartidas: 0, porcentaje_acred: 0, horas_extra: 0 },
            update: {},
          })
        }
      } else if (rol === 'beneficiario') {
        await tx.beneficiario.update({
          where: { id_usuario: id },
          data: { id_periodo: pid, id_tutor: id_tutor ? Number(id_tutor) : null, grado_escolar, escuela, nombre_tutor_legal, tel_tutor }
        })
      } else if (rol === 'revisor') {
        await tx.revisor.update({
          where: { id_usuario: id },
          data: { id_periodo: pid, matricula, carrera, semestre: semestre ? Number(semestre) : null }
        })
      } else if (rol === 'coordinador') {
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
