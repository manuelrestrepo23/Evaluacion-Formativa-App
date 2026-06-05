import mongoose from "mongoose"

const evaluationSchema = mongoose.Schema({
    teacherId: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required:true
    },
    userRole: {
        type: String,
        enum: ['docente', 'estudiante'], // Solo acepta evaluacion de estas dos roles
        required: true
    },
    evaluationData: {
        scores: {
            type: Map, // Map de cada pregunta con su respuesta: "1": 4, "2": 3, ...
            of: Number
        },
        openAnswers: {
            type: Map, // Map de cada pregunta abierta con su respuesta de texto
            of: String
        }
    }
}, {timestamps: true})

export default mongoose.model('Evaluation', evaluationSchema)