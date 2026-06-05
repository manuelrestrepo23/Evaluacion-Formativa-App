import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function processResults(results, questions) {
  if (!results || !results.hasData) return null

  const { selfEvaluation, studentEvaluations } = results
  const openQuestions = questions?.filter(q => q.questionType === 'abierta') || []

  // Scores Likert - autoevaluación
  const selfScores = selfEvaluation
    ? Object.entries(selfEvaluation.evaluationData?.scores || {}).map(([id, score]) => ({
        questionId: parseInt(id),
        score
      }))
    : []

  // Respuestas abiertas - autoevaluación
  const selfOpenAnswers = selfEvaluation
    ? openQuestions.map(q => ({
        question: q.question,
        answer: selfEvaluation.evaluationData?.openAnswers?.[q.number] || ''
      })).filter(a => a.answer)
    : []

  // Scores Likert - estudiantes
  const studentScoresMap = {}
  studentEvaluations.forEach(evaluation => {
    const scoresData = evaluation.evaluationData?.scores || {}
    Object.entries(scoresData).forEach(([id, score]) => {
      const questionId = parseInt(id)
      if (!studentScoresMap[questionId]) studentScoresMap[questionId] = []
      if (typeof score === 'number' && score > 0) studentScoresMap[questionId].push(score)
    })
  })

  const studentScores = Object.entries(studentScoresMap).map(([id, scores]) => ({
    questionId: parseInt(id),
    score: scores.reduce((a, b) => a + b, 0) / scores.length
  }))

  // Respuestas abiertas - estudiantes agrupadas por pregunta
  const studentOpenAnswers = openQuestions.map(q => ({
    question: q.question,
    answers: studentEvaluations
      .map(e => e.evaluationData?.openAnswers?.[q.number])
      .filter(a => a && a.trim())
  })).filter(a => a.answers.length > 0)

  return {
    selfScores,
    studentScores,
    selfOpenAnswers,
    studentOpenAnswers,
    hasData: selfScores.length > 0 || studentScores.length > 0,
    hasSelfEvaluation: selfScores.length > 0,
    hasStudentEvaluations: studentScores.length > 0,
    studentCount: studentEvaluations.length
  }
}

function exportCSV(teacherName, processedData) {
  if (!processedData?.hasData) return

  let csv = `Resultados de Evaluación - ${teacherName}\n`
  csv += `Fecha: ${new Date().toLocaleDateString()}\n\n`

  if (processedData.hasSelfEvaluation) {
    const avg = processedData.selfScores.reduce((s, x) => s + x.score, 0) / processedData.selfScores.length
    csv += `AUTOEVALUACIÓN\nPromedio,${avg.toFixed(2)}\n\n`

    if (processedData.selfOpenAnswers?.length > 0) {
      csv += `RESPUESTAS ABIERTAS - AUTOEVALUACIÓN\n`
      processedData.selfOpenAnswers.forEach(a => {
        csv += `"${a.question}","${a.answer.replace(/"/g, '""')}"\n`
      })
      csv += '\n'
    }
  }

  if (processedData.hasStudentEvaluations) {
    const avg = processedData.studentScores.reduce((s, x) => s + x.score, 0) / processedData.studentScores.length
    csv += `EVALUACIÓN ESTUDIANTIL\nEvaluaciones recibidas,${processedData.studentCount}\nPromedio,${avg.toFixed(2)}\n\n`

    if (processedData.studentOpenAnswers?.length > 0) {
      csv += `RESPUESTAS ABIERTAS - ESTUDIANTES\n`
      processedData.studentOpenAnswers.forEach(a => {
        csv += `Pregunta,"${a.question}"\n`
        a.answers.forEach((ans, i) => {
          csv += `Respuesta ${i + 1},"${ans.replace(/"/g, '""')}"\n`
        })
        csv += '\n'
      })
    }
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `resultados_${teacherName}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

export default function TeacherResults({ results, plans, questions, teacherId, onClose, onCreatePlan }) {
  const processedData = processResults(results, questions)

  const selfAverage = processedData?.hasSelfEvaluation
    ? processedData.selfScores.reduce((s, x) => s + x.score, 0) / processedData.selfScores.length
    : 0

  const studentAverage = processedData?.hasStudentEvaluations
    ? processedData.studentScores.reduce((s, x) => s + x.score, 0) / processedData.studentScores.length
    : 0

  const barData = [
    { name: 'Promedio General', Autoevaluación: parseFloat(selfAverage.toFixed(2)), Estudiantes: parseFloat(studentAverage.toFixed(2)) }
  ]

  const radarData = ['1-2', '2-3', '3-4', '4-5'].map((range, i) => {
    const ranges = [[0, 2], [2, 3], [3, 4], [4, 5]]
    const [min, max] = ranges[i]
    return {
      range,
      Autoevaluación: processedData?.selfScores.filter(s => s.score > min && s.score <= max).length || 0,
      Estudiantes: processedData?.studentScores.filter(s => s.score > min && s.score <= max).length || 0
    }
  })

  return (
    <div className="card mt-4">
      <div className="card-header role-teacher d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Resultados de Evaluación</h4>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-light"
            onClick={() => exportCSV(teacherId?.split('@')[0], processedData)}
          >
            <i className="bi bi-download me-1"></i>Exportar
          </button>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>
            <i className="bi bi-x-lg me-1"></i>Cerrar
          </button>
        </div>
      </div>

      <div className="card-body">
        {!processedData?.hasData ? (
          <div className="alert alert-info">
            <h5 className="alert-heading"><i className="bi bi-info-circle me-2"></i>No hay datos disponibles</h5>
            <p className="mb-0">Aún no se han recopilado suficientes datos para generar resultados.</p>
            <hr />
            <p className="mb-0 small">
              {!results?.selfEvaluation && '• Completa tu autoevaluación'}
              {(!results?.studentEvaluations || results.studentEvaluations.length === 0) && <><br />• Espera a que los estudiantes completen sus evaluaciones</>}
            </p>
          </div>
        ) : (
          <>
            {/* Gráficas */}
            <div className="row mb-4">
              <div className="col-lg-6 mb-4">
                <h5 className="mb-3">Promedio General</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    {processedData.hasSelfEvaluation && <Bar dataKey="Autoevaluación" fill="#466B3F" />}
                    {processedData.hasStudentEvaluations && <Bar dataKey="Estudiantes" fill="#94B43B" />}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="col-lg-6 mb-4">
                <h5 className="mb-3">Distribución de Puntuaciones</h5>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="range" />
                    <Tooltip />
                    <Legend />
                    {processedData.hasSelfEvaluation && <Radar name="Autoevaluación" dataKey="Autoevaluación" stroke="#466B3F" fill="#466B3F" fillOpacity={0.2} />}
                    {processedData.hasStudentEvaluations && <Radar name="Estudiantes" dataKey="Estudiantes" stroke="#94B43B" fill="#94B43B" fillOpacity={0.2} />}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resumen */}
            <div className="alert alert-info mb-4">
              {processedData.hasSelfEvaluation && (
                <p className="mb-1"><strong>Promedio Autoevaluación:</strong> <span className="badge bg-primary">{selfAverage.toFixed(2)}</span></p>
              )}
              {processedData.hasStudentEvaluations && (
                <p className="mb-1"><strong>Promedio Estudiantes ({processedData.studentCount}):</strong> <span className="badge bg-warning text-dark">{studentAverage.toFixed(2)}</span></p>
              )}
              {processedData.hasSelfEvaluation && processedData.hasStudentEvaluations && (() => {
                const diff = selfAverage - studentAverage
                if (Math.abs(diff) >= 0.3) {
                  return diff > 0
                    ? <p className="mb-0 mt-2 text-warning"><i className="bi bi-exclamation-triangle me-2"></i>Tu autoevaluación es {diff.toFixed(2)} puntos más alta que la percepción estudiantil.</p>
                    : <p className="mb-0 mt-2 text-success"><i className="bi bi-check-circle me-2"></i>Los estudiantes valoran tu desempeño {Math.abs(diff).toFixed(2)} puntos más alto que tu autoevaluación.</p>
                }
                return <p className="mb-0 mt-2"><i className="bi bi-check-circle me-2"></i>Hay buena alineación entre tu autoevaluación y la percepción estudiantil.</p>
              })()}
            </div>

            {/* Tablas detalladas */}
            {processedData.hasSelfEvaluation && (
              <div className="mb-4">
                <h6 className="text-primary"><i className="bi bi-person-check me-2"></i>Autoevaluación Docente</h6>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm">
                    <thead className="table-primary">
                      <tr><th>Pregunta (ID)</th><th className="text-center">Puntuación</th></tr>
                    </thead>
                    <tbody>
                      {processedData.selfScores.map(s => (
                        <tr key={s.questionId}>
                          <td>Pregunta {s.questionId}</td>
                          <td className="text-center"><span className="badge bg-primary">{s.score}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {processedData.hasStudentEvaluations && (
              <div className="mb-4">
                <h6 className="text-warning"><i className="bi bi-people-fill me-2"></i>Evaluación Estudiantil (Promedio)</h6>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm">
                    <thead className="table-warning">
                      <tr><th>Pregunta (ID)</th><th className="text-center">Promedio</th></tr>
                    </thead>
                    <tbody>
                      {processedData.studentScores.map(s => (
                        <tr key={s.questionId}>
                          <td>Pregunta {s.questionId}</td>
                          <td className="text-center"><span className="badge bg-warning text-dark">{s.score.toFixed(1)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Planes de mejora */}
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5><i className="bi bi-journal-text me-2"></i>Planes de Mejora</h5>
            <button className="btn btn-sm btn-primary" onClick={onCreatePlan}>
              <i className="bi bi-plus me-1"></i>Nuevo Plan
            </button>
          </div>

          {plans.length === 0 ? (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              No hay planes de mejora registrados.
            </div>
          ) : (
            plans.map((plan, index) => {
              const deadline = new Date(plan.deadline)
              const isOverdue = deadline < new Date()
              return (
                <div key={plan._id || index} className="card mb-3">
                  <div className={`card-header d-flex justify-content-between align-items-center ${isOverdue ? 'bg-danger text-white' : 'bg-light'}`}>
                    <h6 className="mb-0"><i className="bi bi-calendar-event me-2"></i>Plan de Mejora #{plans.length - index}</h6>
                    <span className={`badge ${isOverdue ? 'bg-light text-danger' : 'bg-secondary'}`}>
                      {isOverdue ? 'Vencido' : 'Activo'}
                    </span>
                  </div>
                  <div className="card-body">
                    <p><strong>Meta:</strong> {plan.goal}</p>
                    <p><strong>Acciones:</strong> {plan.actions}</p>
                    <p><strong>Indicadores:</strong> {plan.indicators}</p>
                    <p className="mb-0"><strong>Fecha límite:</strong> {deadline.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}