require('dotenv').config({ path: require('path').join(__dirname, '../../prisma/.env') })

const { Pool } = require('pg')
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

// Remove sslmode from the connection string so the ssl option below takes full control
const _parsed = new URL(process.env.DATABASE_URL)
_parsed.searchParams.delete('sslmode')

const pool = new Pool({
  connectionString: _parsed.toString(),
  ssl: { rejectUnauthorized: false },
  max: 4,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

module.exports = prisma
