import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  toggleTheme: () => void
}

const STORAGE_KEY = 'industrial_copilot_theme'

function loadTheme(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) return JSON.parse(saved) as boolean
  } catch {
    // ignore
  }
  return true // default dark
}

function applyTheme(isDark: boolean): void {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

function saveTheme(isDark: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isDark))
  } catch {
    // ignore
  }
}

// Initialize on module load
const initialDark = loadTheme()
applyTheme(initialDark)

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: initialDark,

  toggleTheme: () => {
    const next = !get().isDark
    applyTheme(next)
    saveTheme(next)
    set({ isDark: next })
  },
}))
