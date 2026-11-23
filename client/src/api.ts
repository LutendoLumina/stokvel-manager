import { clearToken, getToken } from './auth'

/** Every server error has this shape (docs/design/api.md, "Errors"). */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

/** What the server sends back about a user. */
export interface UserProfile {
  id: string
  name: string
  phone: string
  email: string | null
  createdAt: string
}

export interface LoginResult {
  accessToken: string
  user: UserProfile
}

/**
 * The one place the app talks to the server.
 * - Adds "Authorization: Bearer <token>" when you're logged in.
 * - Turns any error into an ApiError with a message we can show.
 * - If a logged-in request gets 401 (token expired after 1 hour), logs you out.
 */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', "Can't reach the server. Check your connection.")
  }

  if (response.ok) return (await response.json()) as T

  const error = await response.json().catch(() => null)
  // Expired token on a normal request: log out. (Not for log-in/sign-up themselves:
  // there a 401 means "wrong password", and the page must show that message.)
  // Only if the saved token is still the one this request used: if you logged in
  // again while an old request was on its way, that old 401 mustn't log you out.
  if (response.status === 401 && token && !path.startsWith('/auth/') && getToken() === token) {
    clearToken()
    window.location.assign('/login')
  }
  throw new ApiError(
    response.status,
    error?.error ?? 'ERROR',
    error?.message ?? 'Something went wrong. Please try again.',
  )
}

export const api = {
  signup: (body: { name: string; phone: string; email?: string; password: string }) =>
    request<LoginResult>('POST', '/auth/signup', body),
  login: (body: { phone: string; password: string }) =>
    request<LoginResult>('POST', '/auth/login', body),
  me: () => request<UserProfile>('GET', '/me'),
}
