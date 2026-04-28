import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'


dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(express.json())

// Routes (los iremos agregando uno por uno)
// import teachersRouter from './routes/teachers.js'
// app.use('/api/teachers', teachersRouter)

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