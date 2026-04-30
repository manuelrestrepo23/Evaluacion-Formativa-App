import express from 'express'
import { createClerkClient } from '@clerk/backend'

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

const router = express.Router()

// POST /api/auth/update-role - Actualizar rol del usuario en Clerk
router.post('/update-role', async (req, res) => {
    try {
        const { userId, role } = req.body

        if(!userId || !role) {
            return res.status(400).json({ message: 'userId y role son requeridos' })
        }

        if (!['student', 'teacher', 'director'].includes(role)) {
            return res.status(400).json({ message: 'Rol inválido' })
        }

        const user = await clerkClient.users.updateUser(userId, { 
            publicMetadata: { role }
        })

        res.status(200).json({
            succes: true,
            message: 'Rol actualizado correctamente',
            role: user.publicMetadata.role
        })
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el rol', error: error.message })
    }
})

export default router