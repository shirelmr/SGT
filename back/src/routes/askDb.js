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
  const forbidden = /\b(DROP|INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/i
  const isReadOnlyQuery = /^\s*(SELECT|WITH)\b/i.test(sql)
  if (forbidden.test(sql) || !isReadOnlyQuery) {
    throw new Error('Solo se permiten consultas SELECT')
  }
  return sql
}

function cleanLLMText(rawText) {
  return String(rawText || '')
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '')
    .trim()
}

function parseSqlStatements(rawText) {
  const text = cleanLLMText(rawText).replace(/^\s*(SQL|JSON)\s*:\s*/i, '').trim()

  // Preferred format from Gemini is JSON: {"queries":["SELECT ...", "SELECT ..."]}
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      const queries = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.queries)
          ? parsed.queries
          : []

      const cleanQueries = queries
        .map((q) => String(q || '').trim())
        .filter(Boolean)

      if (cleanQueries.length > 0) {
        return cleanQueries
      }
    } catch (_e) {
      // Fallback to semicolon split if JSON parsing fails.
    }
  }

  const statements = text
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  if (statements.length === 0) {
    throw new Error('No se pudo extraer SQL válido de la respuesta del modelo')
  }

  if (statements.length > 5) {
    throw new Error('Se permiten máximo 5 consultas SELECT por petición')
  }

  return statements
}

async function callGemini(textPrompt) {
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: textPrompt }]
        }]
      })
    }
  )

  const geminiData = await geminiRes.json()
  console.log('GEMINI RESPONSE:', JSON.stringify(geminiData, null, 2))

  if (!geminiRes.ok || !geminiData.candidates) {
    const msg = geminiData?.error?.message || 'Error en la API de Gemini'
    throw new Error(msg)
  }

  return geminiData.candidates[0].content.parts[0].text
}

router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const history = await prisma.auditoriaConsulta.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        timestamp: true,
        pregunta: true,
        sqlGenerado: true,
        filasDevueltas: true
      }
    })
    res.json(history)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const ALTO_VOLUMEN_THRESHOLD = 500

router.post('/', async (req, res) => {
  console.log('KEY:', GEMINI_API_KEY)
  console.log('BODY:', req.body)
  const { pregunta, confirmarAltoVolumen } = req.body

  if (!pregunta) {
    return res.status(400).json({ error: 'Falta la pregunta' })
  }

  try {
    const plannerPrompt = `Eres un experto en SQL para PostgreSQL.
Dado este schema: ${SCHEMA_DDL}
Convierte esta pregunta en español a un conjunto de consultas de extracción de datos.
REGLAS:
- Usa siempre comillas dobles en nombres de tablas y columnas (ejemplo: SELECT "nombre_completo" FROM "Usuario")
- SOLO se permiten sentencias SELECT o WITH (no INSERT/UPDATE/DELETE/DDL)
- NO calcules porcentajes, tasas, promedios ni derivados complejos en SQL; extrae datos base para que el modelo los calcule después
- Usa condiciones por periodo activo cuando aplique
- Limita cada consulta a 200 filas máximo cuando sea posible
- Devuelve ESTRICTAMENTE JSON con este formato:
{"queries":["SELECT ...", "SELECT ..."]}
- No incluyas markdown ni texto extra.
Pregunta: ${pregunta}`

    const plannerText = await callGemini(plannerPrompt)
    const sqlStatements = parseSqlStatements(plannerText)

    for (const sql of sqlStatements) {
      validateSelectOnly(sql)
    }

    if (!confirmarAltoVolumen) {
      let totalEstimatedRows = 0
      for (const sql of sqlStatements) {
        const explainRows = await prisma.$queryRawUnsafe(`EXPLAIN (FORMAT JSON) ${sql}`)
        const estimated = explainRows[0]['QUERY PLAN'][0]['Plan']['Plan Rows']
        totalEstimatedRows += Number(estimated)
      }
      console.log('EXPLAIN total estimated rows:', totalEstimatedRows)

      if (totalEstimatedRows > ALTO_VOLUMEN_THRESHOLD) {
        return res.json({
          warning: true,
          sql: sqlStatements.join(';\n'),
          estimatedRows: totalEstimatedRows,
          mensaje: `Esta consulta podría devolver aproximadamente ${totalEstimatedRows} filas. ¿Deseas continuar de todas formas?`
        })
      }
    }

    const rawResultSets = []
    for (let i = 0; i < sqlStatements.length; i += 1) {
      const rows = await prisma.$queryRawUnsafe(sqlStatements[i])
      rawResultSets.push(Array.isArray(rows) ? rows : [])
    }

    const safeResultSets = JSON.parse(JSON.stringify(rawResultSets, (_k, v) =>
      typeof v === 'bigint' ? v.toString() : v
    ))

    const analysisInput = safeResultSets.map((rows, index) => ({
      consulta: sqlStatements[index],
      filas: rows,
      totalFilas: rows.length
    }))

    const analystPrompt = `Eres un analista de datos del sistema SGT.
Responde en español claro y breve.

Pregunta original:
${pregunta}

Resultados de consultas SQL (JSON):
${JSON.stringify(analysisInput)}

Instrucciones:
- Calcula porcentajes, tasas o comparativos usando SOLO esos datos.
- Si faltan datos para responder completamente, dilo explícitamente.
- Entrega solo texto plano (sin markdown).`

    const respuesta = cleanLLMText(await callGemini(analystPrompt))

    const filas = safeResultSets.reduce((acc, rows) => acc + rows.length, 0)
    const sqlRegistrado = sqlStatements.join(';\n')

    const primaryResults = safeResultSets[0] || []

    await prisma.auditoriaConsulta.create({
      data: {
        pregunta,
        sqlGenerado: sqlRegistrado,
        filasDevueltas: filas
      }
    })

    res.json({
      sql: sqlRegistrado,
      results: primaryResults,
      sqls: sqlStatements,
      resultSets: safeResultSets,
      respuesta
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router