import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import type { DashboardStats } from '../types'

// ─── useAnalytics ──────────────────────────────────────────────────────────────

/**
 * Hook to fetch and auto-refresh the dashboard statistics.
 * Data is considered stale after 30 seconds and polled every 30 seconds.
 */
export function useAnalytics() {
  const query = useQuery<DashboardStats, Error>({
    queryKey: ['analytics'],
    queryFn: analyticsService.getDashboard,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })

  const data = query.data

  return {
    ...query,
    analytics: data
      ? {
          totalDocuments: data.total_documents,
          totalEquipmentTags: data.total_equipment_tags,
          totalQueries: data.total_queries,
          avgConfidence: data.avg_confidence,
          processingQueue: data.processing_queue,
        }
      : null,
    recentQueries:
      data?.recent_queries?.map((q) => ({
        query: q.question,
        confidence: q.confidence,
        timestamp: q.timestamp,
      })) ?? [],
    equipmentAccess:
      data?.most_accessed_equipment?.map((e) => ({
        tag: e.tag,
        count: e.count,
      })) ?? [],
  }
}

// ─── useQueryTrend ─────────────────────────────────────────────────────────────

/**
 * Hook to fetch query volume trend over N days.
 */
export function useQueryTrend(days = 7) {
  return useQuery<Array<{ date: string; count: number; avg_confidence: number }>, Error>({
    queryKey: ['analytics', 'trend', days],
    queryFn: () => analyticsService.getQueryTrend(days),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}
