import { api } from './api'
import type { DashboardStats, AppSettings } from '../types'

export const analyticsService = {
  /**
   * Get aggregated dashboard statistics.
   */
  async getDashboard(): Promise<DashboardStats> {
    const res = await api.get<DashboardStats>('/analytics/dashboard')
    return res.data
  },

  /**
   * Get query volume over time (for charts).
   */
  async getQueryTrend(
    days = 7
  ): Promise<Array<{ date: string; count: number; avg_confidence: number }>> {
    const res = await api.get<
      Array<{ date: string; count: number; avg_confidence: number }>
    >(`/analytics/query-trend?days=${days}`)
    return res.data
  },

  /**
   * Get current application settings.
   */
  async getSettings(): Promise<AppSettings> {
    const res = await api.get<AppSettings>('/analytics/settings')
    return res.data
  },

  /**
   * Update application settings.
   */
  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await api.patch<AppSettings>('/analytics/settings', settings)
    return res.data
  },
}
