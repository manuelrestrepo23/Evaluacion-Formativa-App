import { useClerk } from '@clerk/clerk-react'
import { BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useDirectorData } from '../hooks/useDirectorData.js'

const COLORS = ['#466B3F', '#94B43B', '#A61C31', '#B1B2B0']

function exportCSV(stats) {
  if (!stats?.teachers) return

  let csv = 'Docente,Autoevaluación,Promedio Estudiantes,Evaluaciones Recibidas,Promedio General\n'
  stats.teachers.forEach(teacher => {
    csv += `"${teacher.name}",`
    csv += `${teacher.hasSelfEvaluation ? teacher.selfAverage : 'N/A'},`
    csv += `${teacher.studentEvaluationCount > 0 ? teacher.studentAverage : 'N/A'},`
    csv += `${teacher.studentEvaluationCount},`
    csv += `${teacher.overallAverage > 0 ? teacher.overallAverage : 'N/A'}\n`
  })

  csv += `\nTotal Docentes,${stats.totalTeachers}\n`
  csv += `Total Evaluaciones,${stats.totalEvaluations}\n`
  csv += `Autoevaluaciones,${stats.selfEvaluations}\n`
  csv += `Evaluaciones Estudiantes,${stats.studentEvaluations}\n`
  csv += `Promedio General,${stats.overallAverage}\n`

  // Respuestas abiertas por docente
  csv += '\n\nRESPUESTAS ABIERTAS POR DOCENTE\n'
  stats.teachers.forEach(teacher => {
    csv += `\n${teacher.name}\n`

    if (teacher.selfOpenAnswers?.length > 0) {
      csv += `AUTOEVALUACIÓN\n`
      teacher.selfOpenAnswers.forEach(a => {
        csv += `"${a.question}","${a.answer.replace(/"/g, '""')}"\n`
      })
    }

    if (teacher.studentOpenAnswers?.length > 0) {
      csv += `ESTUDIANTES\n`
      teacher.studentOpenAnswers.forEach(a => {
        csv += `"${a.question}"\n`
        a.answers.forEach((ans, i) => {
          csv += `Respuesta ${i + 1},"${ans.replace(/"/g, '""')}"\n`
        })
      })
    }
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `reporte_evaluaciones_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}
export default function DirectorPage() {
  const { signOut } = useClerk()
  const { stats, loading, error, reload } = useDirectorData()

  const sortedTeachers = stats?.teachers
    ? [...stats.teachers].sort((a, b) => b.overallAverage - a.overallAverage)
    : []

  const barData = sortedTeachers
    .filter(t => t.overallAverage > 0)
    .slice(0, 10)
    .map(t => ({ name: t.name, Promedio: t.overallAverage }))

  const pieData = stats ? [
    { name: 'Con ambas evaluaciones', value: stats.teachers.filter(t => t.hasSelfEvaluation && t.studentEvaluationCount > 0).length },
    { name: 'Solo autoevaluación', value: stats.teachers.filter(t => t.hasSelfEvaluation && t.studentEvaluationCount === 0).length },
    { name: 'Solo evaluación estudiantil', value: stats.teachers.filter(t => !t.hasSelfEvaluation && t.studentEvaluationCount > 0).length },
    { name: 'Sin evaluaciones', value: stats.teachers.filter(t => !t.hasSelfEvaluation && t.studentEvaluationCount === 0).length }
  ] : []

  const radarData = stats?.categoryAverages
    ? Object.entries(stats.categoryAverages).map(([category, average]) => ({ category, Promedio: average }))
    : []

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando estadísticas...</p>
      </div>
    )
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header role-director d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Panel de Directivos - Reportes y Analytics</h4>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-light" onClick={reload}>
              <i className="bi bi-arrow-clockwise me-1"></i>Actualizar
            </button>
            <button className="btn btn-sm btn-light" onClick={() => exportCSV(stats)}>
              <i className="bi bi-download me-1"></i>Exportar
            </button>
            <button className="btn btn-sm btn-light" onClick={() => signOut()}>
              <i className="bi bi-box-arrow-right me-1"></i>Cerrar sesión
            </button>
          </div>
        </div>

        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Tarjetas de estadísticas */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h6 className="card-title">Total Docentes</h6>
                  <h2 className="mb-0">{stats?.totalTeachers ?? '-'}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h6 className="card-title">Evaluaciones Totales</h6>
                  <h2 className="mb-0">{stats?.totalEvaluations ?? '-'}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <h6 className="card-title">Autoevaluaciones</h6>
                  <h2 className="mb-0">{stats?.selfEvaluations ?? '-'}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-dark">
                <div className="card-body">
                  <h6 className="card-title">Promedio General</h6>
                  <h2 className="mb-0">{stats?.overallAverage || '-'}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficas */}
          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <div className="card">
                <div className="card-header"><h5 className="mb-0">Ranking de Docentes por Promedio</h5></div>
                <div className="card-body">
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barData} layout="vertical">
                        <XAxis type="number" domain={[0, 5]} />
                        <YAxis type="category" dataKey="name" width={120} />
                        <Tooltip />
                        <Bar dataKey="Promedio" fill="#94B43B" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted">No hay datos disponibles</p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card">
                <div className="card-header"><h5 className="mb-0">Distribución de Evaluaciones</h5></div>
                <div className="card-body">
                  {pieData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                          {pieData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted">No hay datos disponibles</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Radar por categoría */}
          {radarData.length > 0 && (
            <div className="card mb-4">
              <div className="card-header"><h5 className="mb-0">Promedio por Categoría</h5></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <Radar name="Promedio" dataKey="Promedio" stroke="#94B43B" fill="#94B43B" fillOpacity={0.2} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tabla de docentes */}
          <div className="mt-4">
            <h5>Detalle de Docentes</h5>
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Docente</th>
                    <th>Autoevaluación</th>
                    <th>Promedio Estudiantes</th>
                    <th>Evaluaciones Recibidas</th>
                    <th>Promedio General</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeachers.map(teacher => (
                    <tr key={teacher.id}>
                      <td>{teacher.name}</td>
                      <td>
                        {teacher.hasSelfEvaluation
                          ? <span className="badge bg-primary">{teacher.selfAverage}</span>
                          : <span className="text-muted">Sin datos</span>}
                      </td>
                      <td>
                        {teacher.studentEvaluationCount > 0
                          ? <span className="badge bg-warning text-dark">{teacher.studentAverage}</span>
                          : <span className="text-muted">Sin datos</span>}
                      </td>
                      <td className="text-center">{teacher.studentEvaluationCount}</td>
                      <td><strong>{teacher.overallAverage > 0 ? teacher.overallAverage : '-'}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exportar */}
          <div className="mt-4">
            <button className="btn btn-primary" onClick={() => exportCSV(stats)}>
              Exportar Reporte CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}