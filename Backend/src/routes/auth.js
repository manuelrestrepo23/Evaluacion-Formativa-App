import express from 'express'
import { createClerkClient } from '@clerk/backend'
import Teacher from '../models/Teacher.js'

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

const router = express.Router()

// POST /api/auth/update-role - Actualizar rol del usuario en Clerk
router.post('/update-role', async (req, res) => {
  try {
    const { userId, role, email, fullName, subject } = req.body

    if (!userId || !role) {
      return res.status(400).json({ message: 'userId y role son requeridos' })
    }

    if (!['estudiante', 'docente', 'directivo'].includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' })
    }

    if (role === 'docente' && (!fullName || !subject)) {
      return res.status(400).json({ message: 'Nombre completo y materia son requeridos para docentes' })
    }

    const user = await clerkClient.users.updateUser(userId, {
      publicMetadata: { role }
    })

    // Si el rol es docente, agregarlo a la coleccion de docentes
    if (role === 'docente' && email) {
      const normalizedEmail = email.trim().toLowerCase()
      const existingTeacher = await Teacher.findOne({ id: normalizedEmail })
      if (!existingTeacher) {
        await Teacher.create({
          id: normalizedEmail,
          name: fullName,
          subject
        })
        console.log('Docente agregado a MongoDB:', normalizedEmail)
      }
    }

    res.status(200).json({
      success: true,
      message: 'Rol actualizado correctamente',
      role: user.publicMetadata.role
    })
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el rol', error: error.message })
  }
})

export default router