import { useClerk } from '@clerk/clerk-react'

export default function StudentPage() {
  const { signOut } = useClerk()

  return (
    <div>
      <p>Student Page - En construcción</p>
      <button onClick={() => signOut()}>Cerrar sesión</button>
    </div>
  )
}