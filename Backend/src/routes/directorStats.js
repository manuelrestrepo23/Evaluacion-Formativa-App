import express from 'express'
import Teacher from '../models/Teacher.js'
import Evaluation from '../models/Evaluation.js'
import Question from '../models/Question.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

// GET /api/director-stats - Obtener estadisticas generales para el directivo
router.get('/', requireAuth, requireRole('directivo'), async (req, res) => {
  try {
    const teachers = await Teacher.find()
    const evaluations = await Evaluation.find()
    const teacherQuestions = await Question.find({ type: 'teacher' })
    const studentOpenQuestions = await Question.find({ type: 'student', questionType: 'abierta' })
    const openQuestions = teacherQuestions.filter(q => q.questionType === 'abierta')

    const stats = {
      totalTeachers: teachers.length,
      totalEvaluations: evaluations.length,
      selfEvaluations: evaluations.filter(e => e.userRole === 'docente').length,
      studentEvaluations: evaluations.filter(e => e.userRole === 'estudiante').length,
      teachers: [],
      overallAverage: 0,
      categoryAverages: {}
    }

    // Calcular promedios y respuestas abiertas por docente
    teachers.forEach(teacher => {
      const teacherEvals = evaluations.filter(e => e.teacherId === teacher.id)
      const selfEval = teacherEvals.find(e => e.userRole === 'docente')
      const studentEvals = teacherEvals.filter(e => e.userRole === 'estudiante')

      let selfAverage = 0
      let studentAverage = 0

      if (selfEval) {
        const scores = [...selfEval.evaluationData.scores.values()]
          .filter(v => typeof v === 'number' && v > 0)
        if (scores.length > 0) {
          selfAverage = scores.reduce((a, b) => a + b, 0) / scores.length
        }
      }

      if (studentEvals.length > 0) {
        const allScores = studentEvals.flatMap(e =>
          [...e.evaluationData.scores.values()].filter(v => typeof v === 'number' && v > 0)
        )
        if (allScores.length > 0) {
          studentAverage = allScores.reduce((a, b) => a + b, 0) / allScores.length
        }
      }

      const overallAverage = selfAverage > 0 && studentAverage > 0
        ? (selfAverage + studentAverage) / 2
        : selfAverage > 0 ? selfAverage : studentAverage

      // Respuestas abiertas - autoevaluación
      const selfOpenAnswers = selfEval
        ? openQuestions.map(q => ({
            question: q.question,
            answer: selfEval.evaluationData?.openAnswers?.get(String(q.number)) || ''
          })).filter(a => a.answer)
        : []

      // Respuestas abiertas - estudiantes agrupadas por pregunta
      const studentOpenAnswers = studentOpenQuestions.map(q => ({
        question: q.question,
        answers: studentEvals
          .map(e => e.evaluationData?.openAnswers?.get(String(q.number)))
          .filter(a => a && a.trim())
      })).filter(a => a.answers.length > 0)

      stats.teachers.push({
        id: teacher.id,
        name: teacher.name,
        selfAverage: parseFloat(selfAverage.toFixed(2)),
        studentAverage: parseFloat(studentAverage.toFixed(2)),
        overallAverage: parseFloat(overallAverage.toFixed(2)),
        studentEvaluationCount: studentEvals.length,
        hasSelfEvaluation: !!selfEval,
        selfOpenAnswers,
        studentOpenAnswers
      })
    })

    // Calcular promedio general
    const validAverages = stats.teachers.map(t => t.overallAverage).filter(a => a > 0)
    if (validAverages.length > 0) {
      stats.overallAverage = parseFloat(
        (validAverages.reduce((a, b) => a + b, 0) / validAverages.length).toFixed(2)
      )
    }

    // Calcular promedios por categoria (solo preguntas likert)
    const likertQuestions = teacherQuestions.filter(q => q.questionType === 'likert')
    const categoriesMap = {}
    likertQuestions.forEach(q => {
      if (q.category) {
        if (!categoriesMap[q.category]) categoriesMap[q.category] = []
        categoriesMap[q.category].push(q.number)
      }
    })

    Object.keys(categoriesMap).forEach(category => {
      const questionNumbers = categoriesMap[category]
      const allScores = evaluations.flatMap(e => {
        const scores = e.evaluationData?.scores
        if (!scores) return []
        return questionNumbers
          .filter(n => scores.get(String(n)) && typeof scores.get(String(n)) === 'number' && scores.get(String(n)) > 0)
          .map(n => scores.get(String(n)))
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