import express from 'express'
import Question from '../models/Question.js'

const router = express.Router()

// GET /api/questions?type=teacher - Obtener preguntas de docentes
// GET /api/questions?type=student - Obtener preguntas de estudiantes
// Se separa por type 
router.get('/', async (req, res) => {
    try{
        const { type } = req.query

        if (!type || !['teacher', 'student'].includes(type)) {
            return res.status(400).json({ message: 'Tipo no valido. Use type=teacher o type=student' })
        }
        const questions = await Question.find({ type })
        const sorted = questions.sort((a, b) => a.number - b.number) // Para organizar las preguntas en base al campo number de las preguntas
        res.status(200).json(sorted)
    } catch (error){
        res.status(500).json({ message: 'Error al obtener las preguntas', error: error.message })
    }
})

export default router