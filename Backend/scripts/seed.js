import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Question from '../src/models/Question.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function seed() {
  try {
    console.log('Conectando a MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Conexión exitosa\n')

    // Leer JSONs
    const teacherQuestions = JSON.parse(
      readFileSync(join(__dirname, '../data/teacher-questions-template.json'), 'utf-8')
    )
    const studentQuestions = JSON.parse(
      readFileSync(join(__dirname, '../data/student-questions-template.json'), 'utf-8')
    )

    const allQuestions = [...teacherQuestions, ...studentQuestions]

    // Eliminar preguntas existentes e insertar nuevas
    await Question.deleteMany({})
    console.log('Preguntas anteriores eliminadas')

    const result = await Question.insertMany(allQuestions)
    console.log(`\n${result.length} preguntas insertadas:`)
    console.log(`  Docentes:    ${teacherQuestions.length}`)
    console.log(`  Estudiantes: ${studentQuestions.length}`)
    console.log('\nSeed completado exitosamente')

  } catch (error) {
    console.error('Error en el seed:', error.message)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('Conexión cerrada')
  }
}

seed()