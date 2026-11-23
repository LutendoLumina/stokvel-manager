// Keeps the login token in the browser's localStorage, so a page refresh
// doesn't log you out. Logging out just deletes it (docs/design/api.md).
//
// localStorage can throw (e.g. in some private-browsing modes), so every
// access is wrapped in try/catch: the worst case is "you need to log in again".

const TOKEN_KEY = 'stokvel.accessToken'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Not saved: the user stays logged in until they refresh.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nothing to clear.
  }
}
