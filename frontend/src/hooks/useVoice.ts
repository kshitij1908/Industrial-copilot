import { useState, useCallback, useRef, useEffect } from 'react'

// ─── useVoice ─────────────────────────────────────────────────────────────────

/**
 * Hook for Web Speech API voice-to-text input.
 * Calls onResult(transcript) when speech is recognized.
 */
export function useVoice(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [isSupported] = useState<boolean>(() => {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return

    setError(null)
    setTranscript('')

    const SR =
      window.SpeechRecognition ?? window.webkitSpeechRecognition

    const recognition = new SR()
    recognitionRef.current = recognition

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript
      setTranscript(text)
      onResult(text)
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      setError(e.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognition.start()
    setIsListening(true)
  }, [isSupported, isListening, onResult])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
  }
}
