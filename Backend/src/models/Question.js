import mongoose from "mongoose"

const questionSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Generica', 'Pedagogica', 'Disciplinar', 'Evaluacion'],
        required: true
    },
    type: {
        type: String,
        enum: ['teacher', 'student'], // Se separa preguntas por cuestionario de profesores y estudiantes
        required: true
    }
}, {timestamps: true})

export default mongoose.model('Question', questionSchema)