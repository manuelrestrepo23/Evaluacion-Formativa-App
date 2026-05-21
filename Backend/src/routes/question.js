import express from 'express'
import Question from '../models/Question.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

// GET /api/questions?type=teacher - Obtener preguntas de docentes
// GET /api/questions?type=student - Obtener preguntas de estudiantes
router.get('/', requireAuth, requireRole('student', 'teacher', 'director'), async (req, res) => {
  try {
    const { type } = req.query

    if (!type || !['teacher', 'student'].includes(type)) {
      return res.status(400).json({ message: 'Tipo no válido. Use type=teacher o type=student' })
    }

    const questions = await Question.find({ type })
    const sorted = questions.sort((a, b) => a.number - b.number)
    res.status(200).json(sorted)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las preguntas', error: error.message })
  }
})

export default router