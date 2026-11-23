import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { getToken } from './auth'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { StokvelsPage } from './pages/StokvelsPage'

/** Pages that need a login: no token -> go to the log-in page. */
function RequireLogin({ children }: { children: ReactNode }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

/** Which page to show for which URL. */
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/stokvels"
        element={
          <RequireLogin>
            <StokvelsPage />
          </RequireLogin>
        }
      />
      {/* Anything else (including "/") goes to my stokvels, or log-in if logged out. */}
      <Route path="*" element={<Navigate to="/stokvels" replace />} />
    </Routes>
  )
}

export default App
