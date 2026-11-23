import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { api, ApiError, type UserProfile } from '../api'
import { clearToken } from '../auth'

/**
 * "My stokvels": where you land after logging in (US-01).
 * The list itself arrives in US-02, together with the Stokvel table.
 */
export function StokvelsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
  }, [])

  function logOut() {
    clearToken() // logging out = forgetting the token (docs/design/api.md)
    navigate('/login')
  }

  return (
    <main>
      <header className="row">
        <h1>My stokvels</h1>
        <button type="button" className="secondary" onClick={logOut}>
          Log out
        </button>
      </header>

      {error && (
        <p className="bad" role="alert">
          {error}
        </p>
      )}
      {user && <p>Hi, {user.name}.</p>}

      <p className="muted">You're not in any stokvels yet.</p>
    </main>
  )
}
