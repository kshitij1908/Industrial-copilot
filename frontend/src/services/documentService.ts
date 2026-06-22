import { api } from './api'
import type { Document, DocumentUploadResult } from '../types'

export const documentService = {
  /**
   * Upload one or more files with an optional document type.
   * Calls onProgress(0–100) during upload.
   */
  async upload(
    files: File[],
    documentType: string,
    onProgress?: (pct: number) => void
  ): Promise<DocumentUploadResult> {
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    formData.append('document_type', documentType)

    const res = await api.post<DocumentUploadResult>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          const pct = Math.round((e.loaded / e.total) * 100)
          onProgress(Math.min(pct, 99)) // hold at 99 until response arrives
        }
      },
    })

    if (onProgress) onProgress(100)
    return res.data
  },

  /**
   * List documents with pagination.
   */
  async list(skip = 0, limit = 50): Promise<Document[]> {
    const res = await api.get<Document[]>(`/documents/?skip=${skip}&limit=${limit}`)
    return res.data
  },

  /**
   * Get a single document by ID.
   */
  async get(id: string): Promise<Document> {
    const res = await api.get<Document>(`/documents/${id}`)
    return res.data
  },

  /**
   * Delete a document by ID.
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`)
  },

  /**
   * Re-process a failed document.
   */
  async reprocess(id: string): Promise<Document> {
    const res = await api.post<Document>(`/documents/${id}/reprocess`)
    return res.data
  },

  /**
   * Return the direct download URL for a document.
   */
  getDownloadUrl(id: string): string {
    return `/api/documents/${id}/download`
  },

  /**
   * Return the URL for the document thumbnail/preview.
   */
  getPreviewUrl(id: string): string {
    return `/api/documents/${id}/preview`
  },
}
