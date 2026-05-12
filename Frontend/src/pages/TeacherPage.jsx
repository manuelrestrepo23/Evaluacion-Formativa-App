import { useState } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import axios from 'axios'
import { useTeacherData } from '../hooks/UseTeacherData.js'
import TeacherEvalForm from '../components/TeacherEvalForm.jsx'
import TeacherResults from '../components/TeacherResults.jsx'
import ImprovementPlanModal from '../components/ImprovementPlanModal.jsx'

export default function TeacherPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const teacherId = user?.primaryEmailAddress?.emailAddress

  const { questions, results, plans, hasEvaluated, loading, error, loadResults, markAsEvaluated, setPlans } = useTeacherData(teacherId)

  const [view, setView] = useState('dashboard') // 'dashboard' | 'eval' | 'results'
  const [showPlanModal, setShowPlanModal] = useState(false)

  const handleStartEval = () => setView('eval')
  const handleCancelEval = () => setView('dashboard')

  const handleEvalSubmitted = () => {
    markAsEvaluated()
    setView('dashboard')
  }

  const handleViewResults = async () => {
    await loadResults()
    setView('results')
  }

  const handlePlanSaved = (newPlan) => {
    setPlans(prev => [newPlan, ...prev])
    setShowPlanModal(false)
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
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Header */}
      <div className="card mb-4">
        <div className="card-header role-teacher d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Panel Docente</h4>
          <div className="d-flex align-items-center gap-2">
            <span className="badge badge-role teacher">Docente</span>
            <button className="btn btn-sm btn-light" onClick={() => signOut()}>
              <i className="bi bi-box-arrow-right"></i> Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard - tres tarjetas */}
      {view === 'dashboard' && (
        <div className="row">
          <div className="col-md-4 mb-3">
            <div className="card dashboard-card h-100">
              <div className="card-header role-teacher">
                <h5 className="mb-0">Autoevaluación</h5>
              </div>
              <div className="card-body d-flex flex-column">
                <p className="card-text">
                  {hasEvaluated
                    ? 'Ya has completado tu autoevaluación. Puedes revisar tus resultados.'
                    : 'Complete su autoevaluación formativa para reflexionar sobre su práctica docente.'}
                </p>
                <button
                  className={`btn mt-auto ${hasEvaluated ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={handleStartEval}
                  disabled={hasEvaluated}
                >
                  {hasEvaluated
                    ? <><i className="bi bi-check-circle me-2"></i>Autoevaluación Completada</>
                    : 'Comenzar Autoevaluación'}
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card dashboard-card h-100">
              <div className="card-header role-teacher">
                <h5 className="mb-0">Resultados</h5>
              </div>
              <div className="card-body d-flex flex-column">
                <p className="card-text">Revise sus resultados de autoevaluación y comparativos con percepciones estudiantiles.</p>
                <button className="btn btn-primary mt-auto" onClick={handleViewResults}>
                  Ver Resultados
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card dashboard-card h-100">
              <div className="card-header role-teacher">
                <h5 className="mb-0">Plan de Mejora</h5>
              </div>
              <div className="card-body d-flex flex-column">
                <p className="card-text">Desarrolle y documente su plan de mejora continua basado en los resultados.</p>
                <button className="btn btn-primary mt-auto" onClick={() => setShowPlanModal(true)}>
                  Crear Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de autoevaluación */}
      {view === 'eval' && (
        <TeacherEvalForm
          questions={questions}
          teacherId={teacherId}
          userEmail={teacherId}
          onSubmitted={handleEvalSubmitted}
          onCancel={handleCancelEval}
        />
      )}

      {/* Resultados */}
      {view === 'results' && (
        <TeacherResults
          results={results}
          plans={plans}
          teacherId={teacherId}
          onClose={() => setView('dashboard')}
          onCreatePlan={() => setShowPlanModal(true)}
        />
      )}

      {/* Modal plan de mejora */}
      {showPlanModal && (
        <ImprovementPlanModal
          teacherId={teacherId}
          userEmail={teacherId}
          onSaved={handlePlanSaved}
          onClose={() => setShowPlanModal(false)}
        />
      )}
    </div>
  )
}