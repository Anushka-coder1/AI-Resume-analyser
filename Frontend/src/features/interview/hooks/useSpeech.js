import { useCallback, useEffect, useRef, useState } from 'react'

const SpeechRecognitionApi = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : undefined

const RECOGNITION_ERRORS = {
  'not-allowed': 'Microphone access was blocked. Allow the microphone in your browser\'s address bar and try again.',
  'service-not-allowed': 'Speech recognition is not allowed in this browser.',
  'audio-capture': 'No microphone was found. Check that one is connected.',
  network: 'Speech recognition needs an internet connection in this browser.',
}

/**
 * Speech-to-text via the Web Speech API (Chrome, Edge, Safari).
 * Final phrases are passed to `onFinal`; the in-progress phrase is returned as `interim`.
 */
export function useSpeechRecognition({ onFinal, lang } = {}) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  const wantListeningRef = useRef(false)
  const onFinalRef = useRef(onFinal)
  useEffect(() => { onFinalRef.current = onFinal }, [onFinal])

  const supported = Boolean(SpeechRecognitionApi)

  const stop = useCallback(() => {
    wantListeningRef.current = false
    recognitionRef.current?.stop()
    setListening(false)
    setInterim('')
  }, [])

  const start = useCallback(() => {
    if (!supported || wantListeningRef.current) return
    setError('')

    const recognition = new SpeechRecognitionApi()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang || navigator.language || 'en-US'

    recognition.onresult = (event) => {
      let pending = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0].transcript
        if (result.isFinal) onFinalRef.current?.(text.trim())
        else pending += text
      }
      setInterim(pending.trim())
    }

    recognition.onerror = (event) => {
      // "no-speech" and "aborted" are normal (silence / we stopped it).
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setError(RECOGNITION_ERRORS[event.error] || 'Speech recognition stopped unexpectedly. Try again.')
      wantListeningRef.current = false
    }

    // Browsers end recognition after a pause; restart while the user still wants to talk.
    recognition.onend = () => {
      if (wantListeningRef.current) {
        try { recognition.start() } catch { wantListeningRef.current = false }
      }
      if (!wantListeningRef.current) {
        setListening(false)
        setInterim('')
      }
    }

    recognitionRef.current = recognition
    wantListeningRef.current = true
    try {
      recognition.start()
      setListening(true)
    } catch {
      wantListeningRef.current = false
      setError('Could not start the microphone. Try again.')
    }
  }, [lang, supported])

  useEffect(() => () => {
    wantListeningRef.current = false
    recognitionRef.current?.abort()
  }, [])

  return { supported, listening, interim, error, start, stop }
}

/** Text-to-speech via speechSynthesis. */
export function useSpeechSynthesis() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)

  const cancel = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  const speak = useCallback((text) => {
    if (!supported || !text) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const lang = (navigator.language || 'en-US').toLowerCase()
    utterance.voice = voices.find((v) => v.lang.toLowerCase() === lang)
      || voices.find((v) => v.lang.toLowerCase().startsWith('en'))
      || null
    utterance.rate = 1
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [supported])

  useEffect(() => () => { if (supported) window.speechSynthesis.cancel() }, [supported])

  return { supported, speaking, speak, cancel }
}
