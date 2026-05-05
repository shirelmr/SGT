const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const prisma = require('../db')
const auth = require('../middleware/auth')
const { sendAceptacionEmail } = require('../mailer')

const router = express.Router()

// ── File storage ──────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
    cb(null, unique + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'))
  },
})

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getPeriodoActivo() {
  return prisma.periodo.findFirst({ where: { activo: true } })
}

// ── POST /api/postulaciones  (public) ─────────────────────────────────────────
router.post('/', upload.single('captura_duolingo'), async (req, res) => {
  const {
    nombre_completo,
    email,
    matricula,
    carrera,
    semestre,
    por_que_escogerte,
    por_que_interesa,
    link_video,
  } = req.body

  if (!nombre_completo || !email || !matricula || !carrera || !semestre || !por_que_escogerte || !por_que_interesa) {
    return res.status(400).json({ error: 'Todos los campos obligatorios son requeridos' })
  }

  try {
    const periodo = await getPeriodoActivo()
    if (!periodo) {
      return res.status(400).json({ error: 'No hay un periodo activo. Intenta más tarde.' })
    }

    const captura_duolingo = req.file ? `/uploads/${req.file.filename}` : null

    const postulacion = await prisma.postulacion.create({
      data: {
        id_periodo: periodo.id_periodo,
        nombre_completo,
        email,
        matricula,
        carrera,
        semestre: Number(semestre),
        por_que_escogerte,
        por_que_interesa,
        captura_duolingo,
        link_video: link_video || null,
      },
    })

    res.status(201).json(postulacion)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ── GET /api/postulaciones  (coordinador) ─────────────────────────────────────
router.get('/', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso denegado' })
  }

  const { estado } = req.query

  try {
    const periodo = await getPeriodoActivo()
    const where = {}
    if (periodo) where.id_periodo = periodo.id_periodo
    if (estado) where.estado = estado

    const postulaciones = await prisma.postulacion.findMany({
      where,
      orderBy: { fecha_postulacion: 'desc' },
    })

    res.json(postulaciones)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ── PATCH /api/postulaciones/:id/aceptar  (coordinador) ───────────────────────
router.patch('/:id/aceptar', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso denegado' })
  }
  try {
    const postulacion = await prisma.postulacion.findUnique({
      where: { id_postulacion: Number(req.params.id) },
    })
    if (!postulacion) return res.status(404).json({ error: 'Postulación no encontrada' })

    const periodo = await getPeriodoActivo()

    // If a user account already exists with this email, update their period
    if (periodo) {
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email: postulacion.email },
        include: { tutor: true },
      })

      if (usuarioExistente?.tutor) {
        await prisma.tutorTec.update({
          where: { id_usuario: usuarioExistente.id_usuario },
          data: { id_periodo: periodo.id_periodo },
        })
      }
    }

    const p = await prisma.postulacion.update({
      where: { id_postulacion: Number(req.params.id) },
      data: { estado: 'aceptado' },
    })

    sendAceptacionEmail({ nombre: postulacion.nombre_completo, email: postulacion.email })
      .catch(err => console.error('Error enviando correo de aceptación:', err))

    res.json(p)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ── PATCH /api/postulaciones/:id/rechazar  (coordinador) ──────────────────────
router.patch('/:id/rechazar', auth, async (req, res) => {
  if (req.user.rol !== 'coordinador') {
    return res.status(403).json({ error: 'Acceso denegado' })
  }
  try {
    const p = await prisma.postulacion.update({
      where: { id_postulacion: Number(req.params.id) },
      data: { estado: 'rechazado' },
    })
    res.json(p)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
