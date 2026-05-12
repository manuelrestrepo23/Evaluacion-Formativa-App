import { useState, useEffect } from 'react'
import axios from 'axios'

export function useTeacherData(teacherId) {
  const [questions, setQuestions] = useState([])
  const [results, setResults] = useState(null)
  const [plans, setPlans] = useState([])
  const [hasEvaluated, setHasEvaluated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!teacherId) return
    loadData()
  }, [teacherId])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [questionsRes, selfCheckRes] = await Promise.all([
        axios.get('/api/questions?type=teacher'),
        axios.get(`/api/evaluations/teacher-self-check?teacherId=${encodeURIComponent(teacherId)}`)
      ])

      setQuestions(questionsRes.data)
      setHasEvaluated(selfCheckRes.data.hasEvaluated)
    } catch (err) {
      setError('Error al cargar los datos. Por favor recarga la página.')
      console.log('Error cargando datos del docente:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadResults = async () => {
    try {
      const [resultsRes, plansRes] = await Promise.all([
        axios.get(`/api/evaluations/teacher-results?teacherId=${encodeURIComponent(teacherId)}`),
        axios.get(`/api/improvement-plans?teacherId=${encodeURIComponent(teacherId)}`)
      ])
      setResults(resultsRes.data)
      setPlans(plansRes.data.plans || [])
    } catch (err) {
      console.log('Error cargando resultados:', err)
    }
  }

  const markAsEvaluated = () => setHasEvaluated(true)

  return { questions, results, plans, hasEvaluated, loading, error, loadResults, markAsEvaluated, setPlans }
}