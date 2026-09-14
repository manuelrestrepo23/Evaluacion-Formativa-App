import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import { connectDB } from './config/db.js'
import teachersRouter from './routes/teachers.js'
import questionsRouter from './routes/question.js'
import evaluationsRouter from './routes/evaluations.js'
import improvementPlansRouter from './routes/improvementPlans.js'
import directorStatsRouter from './routes/directorStats.js'
import authRouter from './routes/auth.js'
import cookieParser from 'cookie-parser'



const app = express()
const PORT = process.env.PORT || 5000

// Origenes permitidos por CORS: lista separada por comas en FRONTEND_URL (dev y/o prod)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Permitir herramientas sin origin (curl, Postman) y los origenes de la lista
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`Origen no permitido por CORS: ${origin}`))
    }
  }
}))
app.use(express.json())
app.use(cookieParser())

// Routes 
app.use('/api/teachers', teachersRouter)
app.use('/api/questions', questionsRouter)
app.use('/api/evaluations', evaluationsRouter)
app.use('/api/improvement-plans', improvementPlansRouter)
app.use('/api/director-stats', directorStatsRouter)
app.use('/api/auth', authRouter)

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' })
})

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
  })
})