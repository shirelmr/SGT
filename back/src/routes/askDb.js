const express = require('express')

const prisma = require('../db')

const router = express.Router()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const SCHEMA_DDL = `
  Base de datos PostgreSQL SGT. IMPORTANTE: todos los nombres de tablas y columnas van entre comillas dobles.
  Tablas disponibles:
  - "Usuario" ("id_usuario", "nombre_completo", "email", "rol")
  - "TutorTec" ("id_tutor", "id_usuario", "id_periodo", "matricula", "carrera", "semestre")
  - "Beneficiario" ("id_benef", "id_usuario", "id_periodo", "grado_escolar", "escuela")
  - "Sesion" ("id_sesion", "id_tutor", "id_beneficiario", "id_periodo", "fecha", "hora_inicio", "duracion_hrs", "tema", "estado")
  - "Asistencia" ("id_asistencia", "id_sesion", "confirma_tutor", "confirma_benef")
  - "Bitacora" ("id_bitacora", "id_sesion", "id_tutor", "actividades", "logros", "dificultades", "plan_siguiente", "fecha_registro")
  - "HorasAcreditadas" ("id_horas_acreditadas", "id_tutor", "id_periodo", "horas_impartidas", "porcentaje_acred")
  - "Periodo" ("id_periodo", "nombre", "fecha_inicio", "fecha_fin", "activo")
`

function validateSelectOnly(sql) {
  const forbidden = /^\s*(DROP|INSERT|UPDATE|DELETE|TRUNCATE|ALTER)/i
  const isSelect = /^\s*SELECT/i.test(sql)
  if (forbidden.test(sql) || !isSelect) {
    throw new Error('Solo se permiten consultas SELECT')
  }
  return sql
}

router.post('/', async (req, res) => {
    console.log('KEY:', GEMINI_API_KEY)
    console.log('BODY:', req.body)
  const { pregunta } = req.body

  if (!pregunta) {
    return res.status(400).json({ error: 'Falta la pregunta' })
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Eres un experto en SQL para PostgreSQL.
Dado este schema: ${SCHEMA_DDL}
Convierte esta pregunta en español a una consulta SQL válida.
REGLAS:
- Usa siempre comillas dobles en nombres de tablas y columnas (ejemplo: SELECT "nombre_completo" FROM "Usuario")
- Responde ÚNICAMENTE con el SQL, sin explicaciones ni markdown ni bloques de código.
Pregunta: ${pregunta}`
            }]
          }]
        })
      }
    )

    const geminiData = await geminiRes.json()
    console.log('GEMINI RESPONSE:', JSON.stringify(geminiData, null, 2))

    if (!geminiRes.ok || !geminiData.candidates) {
      const msg = geminiData?.error?.message || 'Error en la API de Gemini'
      return res.status(502).json({ error: msg })
    }

    let sql = geminiData.candidates[0].content.parts[0].text.trim()
    sql = sql.replace(/```sql|```/g, '').trim()

    validateSelectOnly(sql)

    const results = await prisma.$queryRawUnsafe(sql)
    const filas = Array.isArray(results) ? results.length : 0

    await prisma.auditoriaConsulta.create({
      data: {
        pregunta,
        sqlGenerado: sql,
        filasDevueltas: filas
      }
    })

    const safeResults = JSON.parse(JSON.stringify(results, (_k, v) =>
      typeof v === 'bigint' ? v.toString() : v
    ))
    res.json({ sql, results: safeResults })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router