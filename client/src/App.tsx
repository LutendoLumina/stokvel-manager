import { useEffect, useState } from 'react'

// What we show on screen. "checking" is the state before the server answers.
type Health =
  | { state: 'checking' }
  | { state: 'ok' }
  | { state: 'database-down' }
  | { state: 'server-down' }

function App() {
  const [health, setHealth] = useState<Health>({ state: 'checking' })

  // Runs once when the page opens: ask the server if it's healthy.
  useEffect(() => {
    // "/api/..." goes to Vite, which passes it on to the server (see vite.config.ts).
    fetch('/api/v1/health')
      .then((response) => {
        if (response.ok) setHealth({ state: 'ok' })
        else if (response.status === 503) setHealth({ state: 'database-down' })
        else setHealth({ state: 'server-down' })
      })
      .catch(() => setHealth({ state: 'server-down' }))
  }, [])

  return (
    <main>
      <h1>Stokvel Manager</h1>
      <p className="muted">Walking skeleton: checking every part is connected.</p>

      <ul>
        <li>
          Server:{' '}
          {health.state === 'checking' && <span className="muted">checking…</span>}
          {health.state === 'server-down' && <span className="bad">not reachable</span>}
          {(health.state === 'ok' || health.state === 'database-down') && (
            <span className="ok">ok</span>
          )}
        </li>
        <li>
          Database:{' '}
          {health.state === 'checking' && <span className="muted">checking…</span>}
          {health.state === 'ok' && <span className="ok">up</span>}
          {health.state === 'database-down' && <span className="bad">down</span>}
          {health.state === 'server-down' && <span className="muted">unknown</span>}
        </li>
      </ul>
    </main>
  )
}

export default App
