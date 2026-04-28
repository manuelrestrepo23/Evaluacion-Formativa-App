const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB  = require('./config/db.js')


dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middlewares
app.use(cors({ origin: 'http://localhost:3000' }))
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