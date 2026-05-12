import { useSignIn, useSignUp } from '@clerk/clerk-react'
import { useState } from 'react'
import axios from 'axios'

export default function LoginPage() {
  const { signIn, setActive: setActiveSignIn } = useSignIn()
  const { signUp, setActive: setActiveSignUp } = useSignUp()

  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn.create({ identifier: email, password })
      await setActiveSignIn({ session: result.createdSessionId })
    } catch (err) {
      setError('Correo o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden')
    }
    if (!role) {
      return setError('Debes seleccionar un rol')
    }

    setLoading(true)
    try {
      const result = await signUp.create({ emailAddress: email, password })

      await axios.post('/api/auth/update-role', {
        userId: result.createdUserId,
        role
      })

      if (role === 'teacher') { // Se guarda el profesor en mongodb cuando se registra
        await axios.post('/api/teachers', {
          id: email,
          name: email.split('@')[0]
        })
      }

      await setActiveSignUp({ session: result.createdSessionId })
    } catch (err) {
      console.log('Error completo:', err)
      setError('Error al registrarse. Verifica los datos ingresados')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="container mt-5">
      <div className="login-card">
        <div className="card">
          <div className={`card-header ${isRegistering ? 'role-teacher' : ''}`}>
            <h4 className="mb-0 w-100 text-center">
              {isRegistering ? 'Registro de Usuario' : 'Iniciar Sesión'}
            </h4>
          </div>

          <div className="card-body">
            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            <form onSubmit={isRegistering ? handleRegister : handleLogin}>
              <div className="mb-3">
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {isRegistering && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Confirmar Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Repite tu contraseña"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Rol</label>
                    <select
                      className="form-select"
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      required
                    >
                      <option value="">-- Seleccione un rol --</option>
                      <option value="student">Estudiante</option>
                      <option value="teacher">Docente</option>
                      <option value="director">Directivo</option>
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit"
                className={`btn w-100 ${isRegistering ? 'btn-success' : 'btn-primary'}`}
                disabled={loading}
              >
                {loading
                  ? 'Cargando...'
                  : isRegistering ? 'Registrarse' : 'Ingresar'
                }
              </button>
            </form>
          </div>

          <div className="card-footer text-center">
            {isRegistering ? (
              <button className="btn btn-link" onClick={() => setIsRegistering(false)}>
                ¿Ya tienes una cuenta? Inicia sesión aquí
              </button>
            ) : (
              <button className="btn btn-link" onClick={() => setIsRegistering(true)}>
                ¿No tienes una cuenta? Regístrate aquí
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}