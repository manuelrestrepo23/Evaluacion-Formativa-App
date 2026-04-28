import mongoose from 'mongoose'

const teacherSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        default: ''
    }
}, {timestamps: true})

export default mongoose.model('Teacher', teacherSchema)