import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Conexión a MongoDB exitosa')
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message)
    process.exit(1)
  }
}

module.exports = { connectDB }