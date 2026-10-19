import { SignIn } from '@clerk/clerk-react'

export default function LoginPage() {
  return (
    <div className="container mt-5 d-flex flex-column align-items-center">
      <h4 className="mb-4 text-center">Evaluación Formativa Docente</h4>

      <div className="alert alert-warning login-aviso" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true"></i>
        <strong>Ingresa con tu correo institucional @unal.edu.co</strong>
        <div className="small mt-1">
          Continúa con Google y elige tu cuenta de la universidad.
        </div>
      </div>

      <SignIn routing="virtual" fallbackRedirectUrl="/" />
    </div>
  )
}