import { useState, useEffect } from 'react'
import api from '../api/axios.js'

export function useStudentData(userEmail) {
  const [teachers, setTeachers] = useState([])
  const [questions, setQuestions] = useState([])
  const [evaluatedTeacherIds, setEvaluatedTeacherIds] = useState([])
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
        api.get(`/api/evaluations/student?userEmail=${encodeURIComponent(userEmail)}`)
      ])

      setTeachers(teachersRes.data)
      setQuestions(questionsRes.data)
      setEvaluatedTeacherIds(evaluationsRes.data.evaluatedTeacherIds || [])
    } catch (err) {
      setError('Error al cargar los datos. Por favor recarga la página.')
      console.log('Error cargando datos del estudiante:', err)
    } finally {
      setLoading(false)
    }
  }

  const markTeacherAsEvaluated = (teacherId) => {
    setEvaluatedTeacherIds(prev => [...prev, teacherId])
  }

  return { teachers, questions, evaluatedTeacherIds, loading, error, markTeacherAsEvaluated, reload: loadData }
}