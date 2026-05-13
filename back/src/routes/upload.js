const express = require('express')
const multer = require('multer')
const path = require('path')
const { v2: cloudinary } = require('cloudinary')
const auth = require('../middleware/auth')

const router = express.Router()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|pdf)$/i
    if (!allowed.test(path.extname(file.originalname))) {
      return cb(new Error('Solo se permiten imágenes (JPG, PNG, WebP) y PDF'))
    }
    cb(null, true)
  },
})

function subirACloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      })
      .end(buffer)
  })
}

// POST /api/upload
router.post('/', auth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' })

    try {
      const isPdf = path.extname(req.file.originalname).toLowerCase() === '.pdf'
      const result = await subirACloudinary(req.file.buffer, {
        folder: 'sgt/evidencias',
        resource_type: isPdf ? 'raw' : 'image',
      })
      res.json({ url: result.secure_url })
    } catch (e) {
      res.status(500).json({ error: 'Error al subir archivo a Cloudinary' })
    }
  })
})

module.exports = router
