import { api } from './api'
import type { ChatQueryRequest, ChatQueryResponse, HistoryItem, HistoryResponse } from '../types'

export type { ChatQueryRequest, ChatQueryResponse }

export const chatService = {
  /**
   * Send a question and receive a grounded answer with sources.
   */
  async query(request: ChatQueryRequest): Promise<ChatQueryResponse> {
    const res = await api.post<ChatQueryResponse>('/chat/query', request)
    return res.data
  },

  /**
   * Retrieve suggested questions, optionally seeded by a document ID.
   */
  async getSuggestions(docId?: string): Promise<string[]> {
    const params = docId ? `?doc_id=${encodeURIComponent(docId)}` : ''
    const res = await api.get<{ suggestions: string[] }>(`/chat/suggestions${params}`)
    return res.data.suggestions ?? []
  },

  /**
   * Get query history with pagination.
   */
  async getHistory(skip = 0, limit = 20): Promise<HistoryResponse> {
    const res = await api.get<HistoryResponse>(
      `/chat/history?skip=${skip}&limit=${limit}`
    )
    return res.data
  },

  /**
   * Get a single history item by query ID.
   */
  async getHistoryItem(queryId: string): Promise<HistoryItem> {
    const res = await api.get<HistoryItem>(`/chat/history/${queryId}`)
    return res.data
  },

  /**
   * Submit feedback for a query (thumbs up/down).
   */
  async submitFeedback(
    queryId: string,
    rating: 'positive' | 'negative',
    comment?: string
  ): Promise<void> {
    await api.post(`/chat/feedback`, { query_id: queryId, rating, comment })
  },
}
