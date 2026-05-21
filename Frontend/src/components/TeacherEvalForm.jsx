import { useState } from 'react'
import axios from '../api/axios.js'

export default function TeacherEvalForm({ questions, teacherId, userEmail, onSubmitted, onCancel }) {
  const [scores, setScores] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleScoreChange = (questionNumber, value) => {
    setScores(prev => ({ ...prev, [questionNumber]: parseInt(value) }))
  }

  const allAnswered = questions.length > 0 && questions.every(q => scores[q.number])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!allAnswered) {
      return setError('Por favor responde todas las preguntas antes de enviar')
    }

    setSubmitting(true)
    try {
      await axios.post('/api/evaluations/submit', {
        teacherId,
        evaluationData: { scores },
        userRole: 'teacher'
      })
      onSubmitted()
    } catch (err) {
      setError('Error al enviar la evaluación. Por favor intenta nuevamente.')
      console.log('Error enviando autoevaluación:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card mt-4">
      <div className="card-header role-teacher d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Formulario de Autoevaluación Docente</h4>
        <span className="badge badge-role teacher">Docente</span>
      </div>

      <div className="card-body">
        <p>Evalúe su desempeño según la siguiente escala:</p>

        <div className="evaluation-scale mb-4">
          <div className="scale-item">1: Totalmente en desacuerdo</div>
          <div className="scale-item">2: En desacuerdo</div>
          <div className="scale-item">3: Indiferente</div>
          <div className="scale-item">4: De acuerdo</div>
          <div className="scale-item">5: Totalmente de acuerdo</div>
        </div>

        <form onSubmit={handleSubmit}>
          {questions.map((question) => (
            <div key={question.number} className="evaluation-item mb-3">
              <h6 className="mb-2">{question.question}</h6>
              <div className="d-flex align-items-center">
                {[1, 2, 3, 4, 5].map(value => (
                  <div key={value}>
                    <input
                      type="radio"
                      className="btn-check"
                      name={`question-${question.number}`}
                      id={`teacher-q-${question.number}-${value}`}
                      value={value}
                      checked={scores[question.number] === value}
                      onChange={() => handleScoreChange(question.number, value)}
                    />
                    <label
                      className="btn btn-outline-primary rounded-circle me-2"
                      htmlFor={`teacher-q-${question.number}-${value}`}
                    >
                      {value}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {error && <div className="alert alert-danger mt-3">{error}</div>}

          <div className="mt-3 d-flex gap-2">
            <button
              type="submit"
              className="btn btn-success"
              disabled={submitting || !allAnswered}
            >
              {submitting ? 'Enviando...' : 'Enviar Evaluación'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}