import express from 'express'
import Evaluation from '../models/Evaluation.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

// GET /api/evaluations/all - Obtener todas las evaluaciones (directivo)
router.get('/all', requireAuth, requireRole('director'), async (req, res) => {
  try {
    const evaluations = await Evaluation.find()
    res.status(200).json({ evaluations })
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las evaluaciones', error: error.message })
  }
})

// GET /api/evaluations/student?userEmail= - Docentes evaluados por un estudiante
router.get('/student', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const { userEmail } = req.query

    if (!userEmail) {
      return res.status(400).json({ message: 'userEmail es requerido' })
    }

    const evaluations = await Evaluation.find({ userEmail, userRole: 'student' })
    const evaluatedTeacherIds = evaluations.map(e => e.teacherId)
    res.status(200).json({ evaluatedTeacherIds })
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las evaluaciones', error: error.message })
  }
})

// GET /api/evaluations/teacher-results?teacherId= - Resultados de un docente
router.get('/teacher-results', requireAuth, requireRole('teacher', 'director'), async (req, res) => {
  try {
    const { teacherId } = req.query

    if (!teacherId) {
      return res.status(400).json({ message: 'teacherId es requerido' })
    }

    const selfEvaluation = await Evaluation.findOne({ teacherId, userRole: 'teacher' })
    const studentEvaluations = await Evaluation.find({ teacherId, userRole: 'student' })
    const hasData = !!selfEvaluation || studentEvaluations.length > 0

    res.status(200).json({ hasData, selfEvaluation, studentEvaluations })
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los resultados', error: error.message })
  }
})

// GET /api/evaluations/teacher-self-check?teacherId= - Verificar si un docente ya se autoevaluó
router.get('/teacher-self-check', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { teacherId } = req.query

    if (!teacherId) {
      return res.status(400).json({ message: 'teacherId es requerido' })
    }

    const selfEvaluation = await Evaluation.findOne({ teacherId, userRole: 'teacher' })
    res.status(200).json({ hasEvaluated: !!selfEvaluation })
  } catch (error) {
    res.status(500).json({ message: 'Error al verificar la autoevaluación', error: error.message })
  }
})

// POST /api/evaluations/submit - Enviar una evaluación
router.post('/submit', requireAuth, requireRole('student', 'teacher'), async (req, res) => {
  try {
    const { teacherId, evaluationData, userEmail, userRole } = req.body

    if (!teacherId || !evaluationData || !userEmail || !userRole) {
      return res.status(400).json({ message: 'Datos incompletos' })
    }

    const evaluation = await Evaluation.create({ teacherId, evaluationData, userEmail, userRole })
    res.status(201).json({ message: 'Evaluación enviada correctamente', id: evaluation._id })
  } catch (error) {
    res.status(500).json({ message: 'Error al enviar la evaluación', error: error.message })
  }
})

export default router