const express = require('express')
const multer = require('multer')
const path = require('path')
const auth = require('../middleware/auth')

const router = express.Router()

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|pdf)$/i
    if (!allowed.test(path.extname(file.originalname))) {
      return cb(new Error('Solo se permiten imágenes (JPG, PNG, WebP) y PDF'))
    }
    cb(null, true)
  },
})

// POST /api/upload
router.post('/', auth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' })
    res.json({ url: `/uploads/${req.file.filename}` })
  })
})

module.exports = router
