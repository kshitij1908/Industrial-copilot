import { create } from 'zustand'
import { api } from '../services/api'

interface User {
  username: string
  fullName?: string | null
  email?: string | null
  role?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const STORAGE_KEY = 'industrial_copilot_auth'

function loadFromStorage(): { isAuthenticated: boolean; user: User | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { isAuthenticated: false, user: null }
    return JSON.parse(raw)
  } catch {
    return { isAuthenticated: false, user: null }
  }
}

function saveToStorage(isAuthenticated: boolean, user: User | null): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ isAuthenticated, user }))
  } catch {
    // silently ignore storage errors
  }
}

function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('token')
  } catch {
    // silently ignore storage errors
  }
}

const stored = loadFromStorage()

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: stored.isAuthenticated,
  user: stored.user,

  login: async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', { username, password })
      const { access_token, username: resUsername, full_name } = response.data
      localStorage.setItem('token', access_token)
      const user: User = { username: resUsername, fullName: full_name, role: 'Operator' }
      saveToStorage(true, user)
      set({ isAuthenticated: true, user })
      return true
    } catch (e) {
      console.error('Login failed', e)
      return false
    }
  },

  logout: () => {
    clearStorage()
    set({ isAuthenticated: false, user: null })
  },
}))
