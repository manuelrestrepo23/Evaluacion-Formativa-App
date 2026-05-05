import express from 'express'
import Teacher from '../models/Teacher.js'

const router = express.Router()

// GET /api/teachers - Obtener todos los docentes
router.get('/', async (req, res) => {
    try {
        const teachers = await Teacher.find()
        res.status(200).json(teachers)
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los docentes', error: error.message })
    }
})

// POST /api/teachers - Agregar un nuevo docente
router.post('/', async (req, res) => {
    try{
        const { id, name, subject } = req.body

        if (!id || !name){
            return res.status(400).json({ message: 'ID y nombre son requeridos' })
        }

        const existingTeacher = await Teacher.findOne({ id })
        if (existingTeacher) {
            return res.status(409).json({ message: 'El docente ya existe' })
        }

        const teacher = await Teacher.create({ id, name, subject })
        res.status(201).json({ message: 'Docente agregado correctamente', teacher })
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar el docente', error: error.message })
    }
})

export default router