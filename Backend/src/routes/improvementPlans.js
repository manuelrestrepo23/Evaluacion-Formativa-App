import express from 'express'
import ImprovementPlan from '../models/ImprovementPlan.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

// GET /api/improvement-plans - Obtener planes de mejora del docente autenticado
router.get('/', requireAuth, requireRole('docente', 'directivo'), async (req, res) => {
  try {
    const teacherId = req.userEmail

    const plans = await ImprovementPlan.find({ teacherId }).sort({ createdAt: -1 })
    res.status(200).json({ plans, count: plans.length })
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los planes de mejora', error: error.message })
  }
})

// POST /api/improvement-plans - Guardar un plan de mejora
router.post('/', requireAuth, requireRole('docente'), async (req, res) => {
  try {
    const { goal, actions, indicators, deadline } = req.body
    const teacherId = req.userEmail
    const userEmail = req.userEmail

    if (!goal || !actions || !indicators || !deadline) {
      return res.status(400).json({ message: 'Datos incompletos' })
    }

    const plan = await ImprovementPlan.create({ teacherId, goal, actions, indicators, deadline, userEmail })
    res.status(201).json({ message: 'Plan de mejora guardado correctamente', plan })
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar el plan de mejora', error: error.message })
  }
})

export default router