import express from 'express'
import ImprovementPlan from '../models/ImprovementPlan.js'

const router = express.Router()

// GET /api/improvement-plans?teacherId= - Obtener planes de mejora de un docente
router.get('/', async (req, res) => {
    try {
        const { teacherId } = req.query

        if (!teacherId) {
            return res.status(400).json({ message: 'teacherId es requerido' })
        }

        const plans = await ImprovementPlan.find({ teacherId }).sort({ createdAt: -1 })
        res.status(200).json({ plans, count: plans.length })
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los planes de mejora', error: error.message })
    }
})


// POST /api/improvement-plans - Guardar un plan de mejora
router.post('/', async (req, res) => {
    try {
        const { teacherId, goal, actions, indicators, deadline, userEmail } = req.body

        if (!teacherId || !goal || !actions || !indicators || !deadline || !userEmail) {
            return res.status(400).json({ message: 'Datos incompletos' })
        }

        const plan = await ImprovementPlan.create({ teacherId, goal, actions, indicator, deadline, userEmail })
        res.status(201).json({ message: 'Plan de mejora guardado correctamente', id: plan._id })
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar el plan de mejora', error: error.message })
    }
})

export default router