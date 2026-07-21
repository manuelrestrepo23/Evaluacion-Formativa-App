import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Evaluation from '../src/models/Evaluation.js'

dotenv.config()

async function checkDuplicates() {
  try {
    console.log('Conectando a MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Conexión exitosa\n')

    const duplicates = await Evaluation.aggregate([
      {
        $group: {
          _id: { userEmail: '$userEmail', teacherId: '$teacherId', userRole: '$userRole' },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ])

    if (duplicates.length === 0) {
      console.log('No se encontraron duplicados. Es seguro crear el índice único.')
    } else {
      console.log(`Se encontraron ${duplicates.length} combinaciones duplicadas:\n`)
      duplicates.forEach(d => {
        console.log(`  userEmail=${d._id.userEmail} teacherId=${d._id.teacherId} userRole=${d._id.userRole} count=${d.count}`)
        console.log(`    ids: ${d.ids.join(', ')}`)
      })
      console.log('\nResuelve manualmente estos duplicados (conservar el más reciente por updatedAt) antes de crear el índice único.')
    }
  } catch (error) {
    console.error('Error verificando duplicados:', error.message)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('Conexión cerrada')
  }
}

checkDuplicates()
