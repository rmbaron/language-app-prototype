// Speech recognition module — swappable.
// Currently uses the Web Speech API (browser built-in, free).
// To upgrade to Whisper or another STT service, replace this file.
// Interface contract: transcribe() returns a Promise that resolves
// to a transcript string, or rejects with an error message.

export function isSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function transcribe(options = {}) {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      reject(new Error('Speech recognition is not supported in this browser. Try Chrome.'))
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = options.lang ?? 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      resolve(event.results[0][0].transcript)
    }

    recognition.onerror = (event) => {
      const messages = {
        'not-allowed': 'Microphone access was denied. Please allow microphone access and try again.',
        'no-speech':   'No speech was detected. Please try again.',
        'network':     'A network error occurred. Please try again.',
      }
      reject(new Error(messages[event.error] ?? `Speech recognition error: ${event.error}`))
    }

    recognition.start()
  })
}
