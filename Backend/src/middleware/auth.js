import { createClerkClient, verifyToken } from '@clerk/backend'

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export const requireAuth = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.__session ||
                        req.headers.authorization?.split(' ')[1]

    if (!sessionToken) {
      return res.status(401).json({ message: 'No autorizado - Token requerido' })
    }

    const payload = await verifyToken(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY
    })

    req.userId = payload.sub
    req.userRole = payload.metadata?.role || payload.metadata?.role

    next()
  } catch (error) {
    console.log('Error verificando token:', error.message)
    return res.status(401).json({ message: 'No autorizado - Token inválido' })
  }
}

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ message: 'Prohibido - Sin rol asignado' })
    }
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: `Prohibido - Se requiere rol: ${roles.join(' o ')}` })
    }
    next()
  }
}