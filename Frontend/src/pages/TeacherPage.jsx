import { useClerk } from '@clerk/clerk-react'

export default function TeacherPage() {
  const { signOut } = useClerk()

  return (
    <div>
      <p>Teachers Page - En construcción</p>
      <button onClick={() => signOut()}>Cerrar sesión</button>
    </div>
  )
}