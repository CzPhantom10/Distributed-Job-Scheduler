import { api } from './api'
import type { LoginRequest, RegisterRequest, TokenResponse, User } from '../types/auth'

export const authService = {
  login: (data: LoginRequest) => api.post<TokenResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<User>('/auth/register', data),
  refresh: (refresh_token: string) => api.post<TokenResponse>('/auth/refresh', { refresh_token }),
  me: () => api.get<User>('/auth/me'),
}
