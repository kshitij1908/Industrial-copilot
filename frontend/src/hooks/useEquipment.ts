import { useQuery } from '@tanstack/react-query'
import { useState, useCallback, useRef } from 'react'
import { equipmentService } from '../services/equipmentService'
import type { Equipment, EquipmentSummary, EquipmentDetail } from '../types'

// ─── useEquipmentList ──────────────────────────────────────────────────────────

/**
 * Fetch all equipment (paginated, but loads first 50 by default).
 */
export function useEquipmentList() {
  return useQuery<Equipment[], Error>({
    queryKey: ['equipment'],
    queryFn: () => equipmentService.list(),
    staleTime: 60_000,
  })
}

// ─── useEquipmentSearch ────────────────────────────────────────────────────────

/**
 * Debounced equipment search hook. Only fires when query.length >= 2.
 */
export function useEquipmentSearch() {
  const [query, setQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const handleSetQuery = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value)
    }, 300)
  }, [])

  const searchQuery = useQuery<EquipmentSummary[], Error>({
    queryKey: ['equipment', 'search', debouncedQuery],
    queryFn: () =>
      debouncedQuery.length >= 2
        ? equipmentService.search(debouncedQuery)
        : Promise.resolve([]),
    enabled: debouncedQuery.length >= 2,
    staleTime: 15_000,
  })

  return {
    query,
    setQuery: handleSetQuery,
    results: searchQuery.data ?? [],
    isLoading: searchQuery.isLoading && debouncedQuery.length >= 2,
    error: searchQuery.error,
  }
}

// ─── useEquipmentDetail ────────────────────────────────────────────────────────

/**
 * Fetch full equipment detail (with documents and recent queries) by tag.
 */
export function useEquipmentDetail(tag: string | undefined) {
  return useQuery<EquipmentDetail, Error>({
    queryKey: ['equipment', 'detail', tag],
    queryFn: () => equipmentService.getDetail(tag!),
    enabled: !!tag,
    staleTime: 60_000,
  })
}

// ─── useEquipmentGraph ─────────────────────────────────────────────────────────

/**
 * Fetch knowledge graph data for a given equipment tag.
 */
export function useEquipmentGraph(tag: string | undefined) {
  return useQuery({
    queryKey: ['equipment', 'graph', tag],
    queryFn: () => equipmentService.getGraph(tag!),
    enabled: !!tag,
    staleTime: 120_000,
  })
}

/**
 * Fetch the overview knowledge graph for all equipment.
 */
export function useOverviewGraph() {
  return useQuery({
    queryKey: ['equipment', 'graph', 'overview'],
    queryFn: () => equipmentService.getOverviewGraph(),
    staleTime: 120_000,
  })
}
