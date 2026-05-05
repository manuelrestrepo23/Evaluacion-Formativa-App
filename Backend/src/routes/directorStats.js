import express from 'express'
import Teacher from '../models/Teacher.js'
import Evaluation from '../models/Evaluation.js'
import Question from '../models/Question.js'

const router = express.Router()

// GET /api/director-stats - Obtener estadisticas generales para el directivo
router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.find()
    const evaluations = await Evaluation.find()
    const teacherQuestions = await Question.find({ type: 'teacher' })
 
    const stats = {
      totalTeachers: teachers.length,
      totalEvaluations: evaluations.length,
      selfEvaluations: evaluations.filter(e => e.userRole === 'teacher').length,
      studentEvaluations: evaluations.filter(e => e.userRole === 'student').length,
      teachers: [],
      overallAverage: 0,
      categoryAverages: {}
    }
 
    // Calcular promedios por docente
    teachers.forEach(teacher => {
      const teacherEvals = evaluations.filter(e => e.teacherId === teacher.id)
      const selfEval = teacherEvals.find(e => e.userRole === 'teacher')
      const studentEvals = teacherEvals.filter(e => e.userRole === 'student')
 
      let selfAverage = 0
      let studentAverage = 0
 
      if (selfEval) {
        const scores = Object.values(selfEval.evaluationData?.scores || {})
          .filter(v => typeof v === 'number' && v > 0)
        if (scores.length > 0) {
          selfAverage = scores.reduce((a, b) => a + b, 0) / scores.length
        }
      }
 
      if (studentEvals.length > 0) {
        const allScores = studentEvals.flatMap(e =>
          Object.values(e.evaluationData?.scores || {}).filter(v => typeof v === 'number' && v > 0)
        )
        if (allScores.length > 0) {
          studentAverage = allScores.reduce((a, b) => a + b, 0) / allScores.length
        }
      }
 
      const overallAverage = selfAverage > 0 && studentAverage > 0
        ? (selfAverage + studentAverage) / 2
        : selfAverage > 0 ? selfAverage : studentAverage
 
      stats.teachers.push({
        id: teacher.id,
        name: teacher.name,
        selfAverage: parseFloat(selfAverage.toFixed(2)),
        studentAverage: parseFloat(studentAverage.toFixed(2)),
        overallAverage: parseFloat(overallAverage.toFixed(2)),
        studentEvaluationCount: studentEvals.length,
        hasSelfEvaluation: !!selfEval
      })
    })
 
    // Calcular promedio general
    const validAverages = stats.teachers.map(t => t.overallAverage).filter(a => a > 0)
    if (validAverages.length > 0) {
      stats.overallAverage = parseFloat(
        (validAverages.reduce((a, b) => a + b, 0) / validAverages.length).toFixed(2)
      )
    }
 
    // Calcular promedios por categoria
    const categoriesMap = {}
    teacherQuestions.forEach(q => {
      if (q.category) {
        if (!categoriesMap[q.category]) categoriesMap[q.category] = []
        categoriesMap[q.category].push(q.number)
      }
    })
 
    Object.keys(categoriesMap).forEach(category => {
      const questionIds = categoriesMap[category]
      const allScores = evaluations.flatMap(e => {
        const scores = e.evaluationData?.scores || {}
        return questionIds
          .filter(qId => scores[qId] && typeof scores[qId] === 'number' && scores[qId] > 0)
          .map(qId => scores[qId])
      })
 
      if (allScores.length > 0) {
        stats.categoryAverages[category] = parseFloat(
          (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)
        )
      }
    })
 
    res.status(200).json(stats)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message })
  }
})
 
export default router
