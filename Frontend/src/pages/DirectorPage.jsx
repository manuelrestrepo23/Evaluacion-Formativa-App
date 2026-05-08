import { useClerk } from '@clerk/clerk-react'

export default function DirectorPage() {
  const { signOut } = useClerk()

  return (
    <div>
      <p>Director Page - En construcción</p>
      <button onClick={() => signOut()}>Cerrar sesión</button>
    </div>
  )
}