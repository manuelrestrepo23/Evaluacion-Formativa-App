import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import teachersRouter from './routes/teachers.js'
import questionsRouter from './routes/question.js'
import evaluationsRouter from './routes/evaluations.js'
import improvementPlansRouter from './routes/improvementPlans.js'
import directorStatsRouter from './routes/directorStats.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(express.json())

// Routes 
app.use('/api/teachers', teachersRouter)
app.use('/api/questions', questionsRouter)
app.use('/api/evaluations', evaluationsRouter)
app.use('/api/improvement-plans', improvementPlansRouter)
app.use('/api/director-stats', directorStatsRouter)

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