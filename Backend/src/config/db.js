import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

export const connectDB = async () => {
  try {
    // El indice unico de Evaluation solo se crea manualmente via script (ver Backend/scripts),
    // nunca automaticamente en produccion, para evitar un crash-loop si ya existen duplicados.
    mongoose.set('autoIndex', process.env.NODE_ENV !== 'production')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Conexión a MongoDB exitosa')
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message)
    process.exit(1)
  }
}