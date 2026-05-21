import { useEffect, useState } from 'react'
import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { setAuthToken } from './api/axios.js'
import LoginPage from './pages/LoginPage.jsx'
import StudentPage from './pages/StudentPage.jsx'
import TeacherPage from './pages/TeacherPage.jsx'
import DirectorPage from './pages/DirectorPage.jsx'

function RoleRouter() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
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

  if (!isLoaded || !tokenReady) return <div>Cargando...</div>

  const role = user?.publicMetadata?.role

  if (!role) return <div>Usuario sin rol asignado. Contacta al administrador.</div>
  if (role === 'student') return <Navigate to="/student" />
  if (role === 'teacher') return <Navigate to="/teacher" />
  if (role === 'director') return <Navigate to="/director" />

  return <Navigate to="/login" />
}

function TokenSync() {
  const { getToken } = useAuth()

  useEffect(() => {
    const updateToken = async () => {
      const token = await getToken()
      setAuthToken(token)
    }
    updateToken()

    // Actualizar token cada 50 segundos para evitar expiración
    const interval = setInterval(updateToken, 50000)
    return () => clearInterval(interval)
  }, [getToken])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <SignedIn>
        <TokenSync />
      </SignedIn>
      <Routes>
        <Route path="/login" element={
          <>
            <SignedOut>
              <LoginPage />
            </SignedOut>
            <SignedIn>
              <RoleRouter />
            </SignedIn>
          </>
        } />

        <Route path="/student" element={
          <SignedIn>
            <StudentPage />
          </SignedIn>
        } />

        <Route path="/teacher" element={
          <SignedIn>
            <TeacherPage />
          </SignedIn>
        } />

        <Route path="/director" element={
          <SignedIn>
            <DirectorPage />
          </SignedIn>
        } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}