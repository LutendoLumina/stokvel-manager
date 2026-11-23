// Keeps the login token in the browser's localStorage, so a page refresh
// doesn't log you out. Logging out just deletes it (docs/design/api.md).
//
// localStorage can refuse to work (e.g. some private-browsing modes), so we
// also keep the token in memory. If saving fails, you stay logged in until
// you refresh the page, instead of being bounced back to the log-in page.

const TOKEN_KEY = 'stokvel.accessToken'

let memoryToken: string | null = null

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? memoryToken
  } catch {
    return memoryToken
  }
}

export function saveToken(token: string) {
  memoryToken = token
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Not saved to the browser: the in-memory copy keeps you logged in until refresh.
  }
}

export function clearToken() {
  memoryToken = null
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nothing saved to clear.
  }
}
