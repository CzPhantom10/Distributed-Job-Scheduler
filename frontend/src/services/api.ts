const BASE = '/api/v1'

function getToken(): string | null {
  return localStorage.getItem('access_token')
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...init, headers })

  if (res.status === 401) {
    // Token expired — clear storage and reload to login
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/login'
    throw new ApiError(401, 'UNAUTHORIZED', 'Session expired')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    
    let message = res.statusText
    let code = 'ERROR'

    if (body) {
      if (typeof body.message === 'string') {
        message = body.message
        code = body.code ?? 'ERROR'
      } else if (typeof body.detail === 'string') {
        message = body.detail
      } else if (body.detail && typeof body.detail.message === 'string') {
        message = body.detail.message
        code = body.detail.code ?? 'ERROR'
      } else if (Array.isArray(body.detail)) {
        // FastAPI validation errors
        message = body.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ')
        code = 'VALIDATION_ERROR'
      }
    }

    throw new ApiError(res.status, code, message)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
