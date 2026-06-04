import { useEffect, useState } from 'react'
import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { setAuthToken } from './api/axios.js'
import LoginPage from './pages/LoginPage.jsx'
import StudentPage from './pages/StudentPage.jsx'
import TeacherPage from './pages/TeacherPage.jsx'
import DirectorPage from './pages/DirectorPage.jsx'

function AuthenticatedApp() {
  const { getToken } = useAuth()
  const { user, isLoaded } = useUser()
  const [tokenReady, setTokenReady] = useState(false)

  useEffect(() => {
    const updateToken = async () => {
      const token = await getToken()
      setAuthToken(token)
      setTokenReady(true)
    }
    updateToken()
    const interval = setInterval(updateToken, 50000)
    return () => clearInterval(interval)
  }, [getToken])

  if (!isLoaded || !tokenReady) return <div className="container mt-5 text-center">
    <div className="spinner-border text-primary" role="status"></div>
    <p className="mt-2">Cargando...</p>
  </div>

  const role = user?.publicMetadata?.role
  if (!role) return <div className="container mt-5"><div className="alert alert-warning">Usuario sin rol asignado. Contacta al administrador.</div></div>

  return (
    <Routes>
      <Route path="/student" element={role === 'student' ? <StudentPage /> : <Navigate to="/login" />} />
      <Route path="/teacher" element={role === 'teacher' ? <TeacherPage /> : <Navigate to="/login" />} />
      <Route path="/director" element={role === 'director' ? <DirectorPage /> : <Navigate to="/login" />} />
      <Route path="*" element={
        role === 'student' ? <Navigate to="/student" /> :
        role === 'teacher' ? <Navigate to="/teacher" /> :
        role === 'director' ? <Navigate to="/director" /> :
        <Navigate to="/login" />
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <>
            <SignedOut><LoginPage /></SignedOut>
            <SignedIn><Navigate to="/" /></SignedIn>
          </>
        } />
        <Route path="/*" element={
          <>
            <SignedOut><Navigate to="/login" /></SignedOut>
            <SignedIn><AuthenticatedApp /></SignedIn>
          </>
        } />
      </Routes>
    </BrowserRouter>
  )
}