import { useState, useCallback, useRef, useEffect } from 'react'
import { chatService } from '../services/chatService'
import type { ChatMessage } from '../types'

const LOCAL_STORAGE_CHAT_KEY = 'factorymind_chat_history'

function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveChatHistory(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages.slice(-20)))
  } catch {
    // ignore errors
  }
}

// ─── Simple ID generator (no uuid dependency required) ─────────────────────────
function genId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

// ─── useChat ───────────────────────────────────────────────────────────────────

/**
 * Hook that manages an in-memory chat session, sending questions to the backend
 * and collecting structured responses (answer + sources + confidence).
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatHistory())
  const [isLoading, setIsLoading] = useState(false)
  const sessionId = useRef<string>(genId())
  const abortRef = useRef<AbortController | null>(null)

  // Save changes to localStorage
  useEffect(() => {
    const toSave = messages.filter((m) => !m.isLoading)
    saveChatHistory(toSave)
  }, [messages])

  // ─── Send Message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return

      const now = new Date().toISOString()

      const userMsg: ChatMessage = {
        id: genId(),
        role: 'user',
        content: question.trim(),
        timestamp: now,
      }

      const loadingId = genId()
      const loadingMsg: ChatMessage = {
        id: loadingId,
        role: 'assistant',
        content: '',
        timestamp: now,
        isLoading: true,
      }

      setMessages((prev) => [...prev, userMsg, loadingMsg])
      setIsLoading(true)

      abortRef.current = new AbortController()

      try {
        const result = await chatService.query({
          question: question.trim(),
          session_id: sessionId.current,
        })

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: result.answer,
                  sources: result.sources,
                  confidence: result.confidence,
                  confidence_label: result.confidence_label,
                  equipment_tags: result.equipment_tags,
                  query_id: result.query_id,
                  isLoading: false,
                }
              : m
          )
        )
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.'

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: `⚠️ ${errMsg}`,
                  isLoading: false,
                }
              : m
          )
        )
      } finally {
        setIsLoading(false)
        abortRef.current = null
      }
    },
    [isLoading]
  )

  // ─── Clear ───────────────────────────────────────────────────────────────────
  const clearMessages = useCallback(() => {
    setMessages([])
    sessionId.current = genId()
  }, [])

  // ─── Cancel in-flight request ─────────────────────────────────────────────────
  const cancelRequest = useCallback(() => {
    abortRef.current?.abort()
    setMessages((prev) =>
      prev.map((m) =>
        m.isLoading ? { ...m, content: '⚠️ Request cancelled.', isLoading: false } : m
      )
    )
    setIsLoading(false)
  }, [])

  return {
    messages,
    isLoading,
    sessionId: sessionId.current,
    sendMessage,
    clearMessages,
    cancelRequest,
  }
}
