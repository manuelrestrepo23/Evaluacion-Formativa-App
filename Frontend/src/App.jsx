import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import StudentPage from './pages/StudentPage.jsx'
import TeacherPage from './pages/TeacherPage.jsx'
import DirectorPage from './pages/DirectorPage.jsx'

function RoleRouter() {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded) return <div>Cargando...</div>
  
  const role = user?.publicMetadata?.role

  if (!role) return <div>Usuario sin rol asignado. Contacta al administrador.</div>
  if (role === 'student') return <Navigate to="/student" />
  if (role === 'teacher') return <Navigate to="/teacher" />
  if (role === 'director') return <Navigate to="/director" />
}

export default function App() {
  return (
    <BrowserRouter>
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