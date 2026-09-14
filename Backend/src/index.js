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

console.log("Frontend url: ", process.env.FRONTEND_URL)
app.use((req, res, next) => {
  console.log("request headers: ", req.headers.origin)
  next()
})
// Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
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