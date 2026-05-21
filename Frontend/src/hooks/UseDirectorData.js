import { useState, useEffect } from 'react'
import axios from '../api/axios.js'

export function useDirectorData() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('/api/director-stats')
      setStats(res.data)
    } catch (err) {
      setError('Error al cargar las estadísticas. Por favor recarga la página.')
      console.log('Error cargando estadísticas del directivo:', err)
    } finally {
      setLoading(false)
    }
  }

  return { stats, loading, error, reload: loadData }
}