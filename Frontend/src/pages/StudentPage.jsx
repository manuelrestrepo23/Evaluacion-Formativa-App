import { useState } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import axios from '../api/axios.js'
import { useStudentData } from '../hooks/useStudentData.js'

export default function StudentPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const userEmail = user?.primaryEmailAddress?.emailAddress

  const { teachers, questions, evaluatedTeacherIds, loading, error, markTeacherAsEvaluated } = useStudentData(userEmail)

  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [scores, setScores] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  const handleTeacherChange = (e) => {
    setSelectedTeacher(e.target.value)
    setScores({})
    setSubmitError('')
    setSubmitSuccess('')
  }

  const handleScoreChange = (questionNumber, value) => {
    setScores(prev => ({ ...prev, [questionNumber]: parseInt(value) }))
  }

  const allAnswered = questions.length > 0 && questions.every(q => scores[q.number])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (!selectedTeacher) {
      return setSubmitError('Por favor selecciona un docente')
    }
    if (!allAnswered) {
      return setSubmitError('Por favor responde todas las preguntas antes de enviar')
    }

    setSubmitting(true)
    try {
      await axios.post('/api/evaluations/submit', {
        teacherId: selectedTeacher,
        evaluationData: { scores },
        userEmail,
        userRole: 'student'
      })

      markTeacherAsEvaluated(selectedTeacher)
      setSelectedTeacher('')
      setScores({})
      setSubmitSuccess('¡Evaluación enviada con éxito! Su respuesta es anónima.')
    } catch (err) {
      setSubmitError('Error al enviar la evaluación. Por favor intenta nuevamente.')
      console.log('Error enviando evaluación:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando datos...</p>
      </div>
    )
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header role-student d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Evaluación de Percepción Estudiantil</h4>
          <div className="d-flex align-items-center gap-2">
            <span className="badge badge-role student">Estudiante</span>
            <button className="btn btn-sm btn-light" onClick={() => signOut()}>
              <i className="bi bi-box-arrow-right"></i> Cerrar sesión
            </button>
          </div>
        </div>

        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {submitSuccess && <div className="alert alert-success">{submitSuccess}</div>}

          <p className="text-muted">Su respuesta es importante. Por favor, sea honesto y objetivo en su evaluación.</p>

          <div className="mb-3">
            <label className="form-label">Seleccione el docente a evaluar:</label>
            <select
              className="form-select"
              value={selectedTeacher}
              onChange={handleTeacherChange}
            >
              <option value="">-- Seleccione un docente --</option>
              {teachers.map(teacher => {
                const isEvaluated = evaluatedTeacherIds.includes(teacher.id)
                return (
                  <option
                    key={teacher.id}
                    value={teacher.id}
                    disabled={isEvaluated}
                  >
                    {teacher.name}
                    {teacher.subject ? ` - ${teacher.subject}` : ''}
                    {isEvaluated ? ' (Ya evaluado)' : ''}
                  </option>
                )
              })}
            </select>
          </div>

          {selectedTeacher && (
            <form onSubmit={handleSubmit}>
              <div className="evaluation-scale mb-4">
                <div className="scale-item">1: Totalmente en desacuerdo</div>
                <div className="scale-item">2: En desacuerdo</div>
                <div className="scale-item">3: Indiferente</div>
                <div className="scale-item">4: De acuerdo</div>
                <div className="scale-item">5: Totalmente de acuerdo</div>
              </div>

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
                          id={`question-${question.number}-${value}`}
                          value={value}
                          checked={scores[question.number] === value}
                          onChange={() => handleScoreChange(question.number, value)}
                        />
                        <label
                          className="btn btn-outline-primary rounded-circle me-2"
                          htmlFor={`question-${question.number}-${value}`}
                        >
                          {value}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {submitError && <div className="alert alert-danger mt-3">{submitError}</div>}

              <div className="mt-3">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !allAnswered}
                >
                  {submitting ? 'Enviando...' : 'Enviar Evaluación'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary ms-2"
                  onClick={() => { setSelectedTeacher(''); setScores({}) }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}