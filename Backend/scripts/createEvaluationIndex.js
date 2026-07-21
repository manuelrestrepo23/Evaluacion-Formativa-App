import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Evaluation from '../src/models/Evaluation.js'

dotenv.config()

// Correr solo despues de checkEvaluationDuplicates.js haber confirmado cero duplicados.
async function createIndex() {
  try {
    console.log('Conectando a MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Conexión exitosa\n')

    console.log('Sincronizando índices de Evaluation...')
    const result = await Evaluation.syncIndexes()
    console.log('Índices sincronizados:', result)
  } catch (error) {
    console.error('Error creando el índice:', error.message)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('Conexión cerrada')
  }
}

createIndex()
