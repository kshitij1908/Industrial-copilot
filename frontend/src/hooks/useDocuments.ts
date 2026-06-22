import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { documentService } from '../services/documentService'
import type { Document } from '../types'

// ─── useDocuments ──────────────────────────────────────────────────────────────

/**
 * Hook to fetch, poll, and delete documents.
 */
export function useDocuments() {
  const queryClient = useQueryClient()

  const query = useQuery<Document[], Error>({
    queryKey: ['documents'],
    queryFn: () => documentService.list(),
    refetchInterval: (query) => {
      const docs = query.state.data
      const hasActive = docs?.some(
        (d) => d.status === 'pending' || d.status === 'processing'
      )
      // Poll every 3 seconds while any doc is still processing
      return hasActive ? 3000 : false
    },
  })

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => documentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })

  const reprocessMutation = useMutation<Document, Error, string>({
    mutationFn: (id: string) => documentService.reprocess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  return {
    documents: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    deleteDocument: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deletingId: deleteMutation.variables,
    reprocessDocument: reprocessMutation.mutate,
    isReprocessing: reprocessMutation.isPending,
  }
}

// ─── useDocumentUpload ─────────────────────────────────────────────────────────

/**
 * Hook to upload documents with progress tracking.
 */
export function useDocumentUpload() {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState(0)

  const onProgress = useCallback((pct: number) => {
    setProgress(pct)
  }, [])

  const mutation = useMutation({
    mutationFn: ({
      files,
      documentType,
    }: {
      files: File[]
      documentType: string
    }) => documentService.upload(files, documentType, onProgress),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      // Reset progress after a short delay so the 100% state is visible briefly
      setTimeout(() => setProgress(0), 1500)
    },

    onError: () => {
      setProgress(0)
    },
  })

  const reset = useCallback(() => {
    setProgress(0)
    mutation.reset()
  }, [mutation])
  return {
    upload: mutation.mutateAsync,
    isUploading: mutation.isPending,
    progress,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset,
  }
}

// ─── useDocument ───────────────────────────────────────────────────────────────

/**
 * Hook to fetch a single document by ID.
 */
export function useDocument(id: string | undefined) {
  return useQuery<Document, Error>({
    queryKey: ['documents', id],
    queryFn: () => documentService.get(id!),
    enabled: !!id,
  })
}
