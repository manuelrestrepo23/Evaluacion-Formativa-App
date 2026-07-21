import { useState, useEffect } from 'react'
import api from '../api/axios.js'

export function useStudentData(userEmail) {
  const [teachers, setTeachers] = useState([])
  const [questions, setQuestions] = useState([])
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userEmail) return
    loadData()
  }, [userEmail])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [teachersRes, questionsRes, evaluationsRes] = await Promise.all([
        api.get('/api/teachers'),
        api.get('/api/questions?type=student'),
        api.get('/api/evaluations/student')
      ])

      setTeachers(teachersRes.data)
      setQuestions(questionsRes.data)
      setProgress(evaluationsRes.data.progress || {})
    } catch (err) {
      setError('Error al cargar los datos. Por favor recarga la página.')
      console.log('Error cargando datos del estudiante:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveAnswer = async (teacherId, questionNumber, questionType, value) => {
    setProgress(prev => ({
      ...prev,
      [teacherId]: {
        status: 'draft',
        scores: prev[teacherId]?.scores || {},
        openAnswers: prev[teacherId]?.openAnswers || {},
        [questionType === 'likert' ? 'scores' : 'openAnswers']: {
          ...(prev[teacherId]?.[questionType === 'likert' ? 'scores' : 'openAnswers'] || {}),
          [questionNumber]: value
        }
      }
    }))

    await api.patch('/api/evaluations/answer', { teacherId, questionNumber, questionType, value })
  }

  const finalizeTeacher = async (teacherId) => {
    await api.post('/api/evaluations/finalize', { teacherId })
    setProgress(prev => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], status: 'submitted' }
    }))
  }

  return {
    teachers,
    questions,
    progress,
    loading,
    error,
    saveAnswer,
    finalizeTeacher,
    reload: loadData
  }
}
