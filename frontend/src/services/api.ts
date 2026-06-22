import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

export const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// ─── Response Interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ detail?: string }>) => {
    const message =
      error.response?.data?.detail ||
      (error.response?.status === 413 ? 'File too large' : null) ||
      (error.response?.status === 404 ? 'Resource not found' : null) ||
      (error.response?.status === 429 ? 'Too many requests, please slow down' : null) ||
      (error.response?.status === 500 ? 'Server error, please try again' : null) ||
      error.message ||
      'Request failed'

    return Promise.reject(new Error(message))
  }
)

export type ApiError = Error
