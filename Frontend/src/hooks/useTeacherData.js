import { useState, useEffect } from 'react'
import api from '../api/axios.js'

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
        api.get('/api/questions?type=teacher'),
        api.get('/api/evaluations/teacher-self-check')
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
        api.get('/api/evaluations/teacher-results'),
        api.get('/api/improvement-plans')
      ])
      setResults(resultsRes.data)
      setPlans(plansRes.data.plans || [])
    } catch (err) {
      console.log('Error cargando resultados:', err)
    }
  }

  const markAsEvaluated = () => setHasEvaluated(true)

  const completePlan = async (planId) => {
    try {
      const res = await api.patch(`/api/improvement-plans/${planId}`)
      setPlans(prev => prev.map(p => p._id === planId ? res.data.plan : p))
    } catch (err) {
      console.log('Error marcando plan como completado:', err)
      throw err
    }
  }

  const deletePlan = async (planId) => {
    try {
      await api.delete(`/api/improvement-plans/${planId}`)
      setPlans(prev => prev.filter(p => p._id !== planId))
    } catch (err) {
      console.log('Error eliminando plan de mejora:', err)
      throw err
    }
  }

  return { questions, results, plans, hasEvaluated, loading, error, loadResults, markAsEvaluated, setPlans, completePlan, deletePlan }
}