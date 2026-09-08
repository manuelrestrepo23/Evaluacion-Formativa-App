import { useState, useEffect, useRef, useMemo } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useStudentData } from '../hooks/useStudentData.js'
import { getErrorMessage } from '../utils/errors.js'

const DEBOUNCE_MS = 600

export default function StudentPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const userEmail = user?.primaryEmailAddress?.emailAddress

  const { teachers, questions, progress, loading, error, saveAnswer, finalizeTeacher } = useStudentData(userEmail)

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.number - b.number),
    [questions]
  )

  const [answers, setAnswers] = useState({})
  const [initialized, setInitialized] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [finalizing, setFinalizing] = useState(false)
  const [finalizeResults, setFinalizeResults] = useState(null)
  const [saveError, setSaveError] = useState('')

  // Profesores agregados manualmente en esta sesión que aún no tienen respuestas guardadas en el servidor.
  const [extraSelected, setExtraSelected] = useState([])
  const [teacherToAdd, setTeacherToAdd] = useState('')

  const debounceTimers = useRef({})

  // Un profesor está "seleccionado" si ya tiene progreso guardado (de una sesión anterior) o si se agregó ahora.
  const selectedIds = useMemo(() => {
    const fromProgress = teachers
      .filter(t => progress[t.id] && progress[t.id].status !== 'submitted')
      .map(t => t.id)
    return Array.from(new Set([...fromProgress, ...extraSelected]))
  }, [teachers, progress, extraSelected])

  const pendingTeachers = teachers.filter(t => selectedIds.includes(t.id))
  const availableTeachers = teachers.filter(t => progress[t.id]?.status !== 'submitted' && !selectedIds.includes(t.id))

  // Hidratar respuestas guardadas y calcular en qué pregunta retomar, una sola vez apenas llegan los datos.
  // Se ajusta el estado directamente durante el render (guardado por `initialized`) en vez de en un efecto,
  // siguiendo el patrón recomendado por React para inicializar estado derivado de datos cargados async.
  if (!initialized && !loading && sortedQuestions.length > 0) {
    const seeded = {}
    pendingTeachers.forEach(t => {
      seeded[t.id] = {
        scores: { ...(progress[t.id]?.scores || {}) },
        openAnswers: { ...(progress[t.id]?.openAnswers || {}) }
      }
    })

    const isComplete = (question) => pendingTeachers.length > 0 && pendingTeachers.every(t => {
      if (question.questionType === 'likert') return seeded[t.id]?.scores?.[question.number] != null
      return !!seeded[t.id]?.openAnswers?.[question.number]?.trim()
    })

    // Si no hay profesores pendientes todavía (nadie seleccionado aún), `pendingTeachers.every(...)`
    // sería vacuously true para cualquier pregunta, dejando el índice congelado en la última pregunta
    // en cuanto `initialized` se marca true. `isComplete` ya evita eso exigiendo al menos un profesor.
    let resumeIndex = sortedQuestions.length - 1
    for (let i = 0; i < sortedQuestions.length; i++) {
      if (!isComplete(sortedQuestions[i])) {
        resumeIndex = i
        break
      }
    }

    setAnswers(seeded)
    setCurrentIndex(resumeIndex)
    setInitialized(true)
  }

  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(byQuestion => {
        Object.values(byQuestion).forEach(timer => clearTimeout(timer))
      })
    }
  }, [])

  const handleAddTeacher = () => {
    if (!teacherToAdd) return
    setExtraSelected(prev => [...prev, teacherToAdd])
    setAnswers(prev => ({
      ...prev,
      [teacherToAdd]: prev[teacherToAdd] || { scores: {}, openAnswers: {} }
    }))
    // El profesor recién agregado no tiene respuestas todavía, así que la primera pregunta
    // sin responder para el grupo completo vuelve a ser la 1.
    setCurrentIndex(0)
    setTeacherToAdd('')
  }

  const handleRemoveTeacher = (teacherId) => {
    if (progress[teacherId]) return // ya tiene respuestas guardadas, no se puede quitar
    setExtraSelected(prev => prev.filter(id => id !== teacherId))
  }

  const isAnswered = (teacherId, question) => {
    const teacherAnswers = answers[teacherId]
    if (!teacherAnswers) return false
    if (question.questionType === 'likert') return teacherAnswers.scores?.[question.number] != null
    return !!teacherAnswers.openAnswers?.[question.number]?.trim()
  }

  const handleLikertChange = (teacherId, question, value) => {
    setAnswers(prev => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        scores: { ...prev[teacherId]?.scores, [question.number]: value }
      }
    }))
    setSaveError('')
    saveAnswer(teacherId, question.number, 'likert', value).catch(err => {
      setSaveError(getErrorMessage(err, 'No se pudo guardar una respuesta.'))
    })
  }

  const handleOpenAnswerChange = (teacherId, question, value) => {
    setAnswers(prev => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        openAnswers: { ...prev[teacherId]?.openAnswers, [question.number]: value }
      }
    }))
    setSaveError('')

    if (!debounceTimers.current[teacherId]) debounceTimers.current[teacherId] = {}
    clearTimeout(debounceTimers.current[teacherId][question.number])
    debounceTimers.current[teacherId][question.number] = setTimeout(() => {
      saveAnswer(teacherId, question.number, 'abierta', value).catch(err => {
        setSaveError(getErrorMessage(err, 'No se pudo guardar una respuesta.'))
      })
      delete debounceTimers.current[teacherId][question.number]
    }, DEBOUNCE_MS)
  }

  const flushPending = async () => {
    const promises = []
    Object.entries(debounceTimers.current).forEach(([teacherId, byQuestion]) => {
      Object.entries(byQuestion).forEach(([questionNumber, timer]) => {
        clearTimeout(timer)
        const value = answers[teacherId]?.openAnswers?.[questionNumber] ?? ''
        promises.push(saveAnswer(teacherId, Number(questionNumber), 'abierta', value))
      })
    })
    debounceTimers.current = {}
    await Promise.allSettled(promises)
  }

  const currentQuestion = sortedQuestions[currentIndex]
  const isLastQuestion = currentIndex === sortedQuestions.length - 1
  const allAnsweredForCurrent = !!currentQuestion && pendingTeachers.every(t => isAnswered(t.id, currentQuestion))

  const goPrev = async () => {
    await flushPending()
    setCurrentIndex(i => Math.max(0, i - 1))
  }

  const goNext = async () => {
    await flushPending()
    setCurrentIndex(i => Math.min(sortedQuestions.length - 1, i + 1))
  }

  const handleFinalize = async () => {
    await flushPending()
    setFinalizing(true)
    setFinalizeResults(null)
    const results = await Promise.allSettled(pendingTeachers.map(t => finalizeTeacher(t.id)))
    const failed = pendingTeachers.filter((_, i) => results[i].status === 'rejected')
    setFinalizeResults({ succeededCount: pendingTeachers.length - failed.length, failed })
    setFinalizing(false)
  }

  if (loading || !initialized) {
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
          {saveError && <div className="alert alert-danger">{saveError}</div>}

          {finalizeResults && finalizeResults.failed.length > 0 && (
            <div className="alert alert-warning">
              No se pudo finalizar la evaluación de: {finalizeResults.failed.map(t => t.name).join(', ')}.
              Revisa las respuestas de esos profesores e inténtalo de nuevo.
            </div>
          )}

          {availableTeachers.length > 0 && (
            <div className="mb-4">
              <label className="form-label">Agrega los profesores que te corresponde evaluar este semestre:</label>
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  value={teacherToAdd}
                  onChange={e => setTeacherToAdd(e.target.value)}
                >
                  <option value="">-- Seleccione un docente --</option>
                  {availableTeachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                      {teacher.subject ? ` - ${teacher.subject}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-outline-primary flex-shrink-0"
                  onClick={handleAddTeacher}
                  disabled={!teacherToAdd}
                >
                  Agregar
                </button>
              </div>

              {pendingTeachers.length > 0 && (
                <ul className="list-group mt-2">
                  {pendingTeachers.map(teacher => (
                    <li key={teacher.id} className="list-group-item d-flex justify-content-between align-items-center">
                      {teacher.name}{teacher.subject ? ` - ${teacher.subject}` : ''}
                      {!progress[teacher.id] && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveTeacher(teacher.id)}
                        >
                          Quitar
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {pendingTeachers.length === 0 ? (
            <div className="alert alert-success">
              {availableTeachers.length === 0
                ? '¡Gracias! Ya evaluaste a todos los profesores disponibles. Tu respuesta es anónima.'
                : 'Aún no has agregado profesores para evaluar. Usa el selector de arriba para agregar los que te correspondan este semestre.'}
            </div>
          ) : (
            <>
              <p className="text-muted">Su respuesta es importante. Por favor, sea honesto y objetivo en su evaluación.</p>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted">Pregunta {currentIndex + 1} de {sortedQuestions.length}</span>
                <span className="badge bg-secondary">{currentQuestion.category}</span>
              </div>
              <div className="progress mb-4" style={{ height: '6px' }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${((currentIndex + 1) / sortedQuestions.length) * 100}%` }}
                />
              </div>

              <h5 className="mb-4">{currentQuestion.question}</h5>

              {currentQuestion.questionType === 'likert' && (
                <div className="evaluation-scale mb-4">
                  <div className="scale-item">1: Totalmente en desacuerdo</div>
                  <div className="scale-item">2: En desacuerdo</div>
                  <div className="scale-item">3: Indiferente</div>
                  <div className="scale-item">4: De acuerdo</div>
                  <div className="scale-item">5: Totalmente de acuerdo</div>
                </div>
              )}

              {pendingTeachers.map(teacher => (
                <div key={teacher.id} className="evaluation-item mb-3 pb-3 border-bottom">
                  <h6 className="mb-2">
                    {teacher.name}
                    {teacher.subject ? ` - ${teacher.subject}` : ''}
                  </h6>

                  {currentQuestion.questionType === 'likert' ? (
                    <div className="d-flex align-items-center">
                      {[1, 2, 3, 4, 5].map(value => (
                        <div key={value}>
                          <input
                            type="radio"
                            className="btn-check"
                            name={`q-${currentQuestion.number}-${teacher.id}`}
                            id={`q-${currentQuestion.number}-${teacher.id}-${value}`}
                            value={value}
                            checked={answers[teacher.id]?.scores?.[currentQuestion.number] === value}
                            onChange={() => handleLikertChange(teacher.id, currentQuestion, value)}
                          />
                          <label
                            className="btn btn-outline-primary rounded-circle me-2"
                            htmlFor={`q-${currentQuestion.number}-${teacher.id}-${value}`}
                          >
                            {value}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Escribe tu respuesta aquí..."
                      value={answers[teacher.id]?.openAnswers?.[currentQuestion.number] || ''}
                      onChange={e => handleOpenAnswerChange(teacher.id, currentQuestion, e.target.value)}
                    />
                  )}
                </div>
              ))}

              <div className="mt-3 d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={goPrev}
                  disabled={currentIndex === 0 || finalizing}
                >
                  Anterior
                </button>
                {isLastQuestion ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleFinalize}
                    disabled={!allAnsweredForCurrent || finalizing}
                  >
                    {finalizing ? 'Enviando...' : 'Finalizar'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={goNext}
                    disabled={!allAnsweredForCurrent || finalizing}
                  >
                    Siguiente
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
