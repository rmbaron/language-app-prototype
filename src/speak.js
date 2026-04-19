// TTS module — speaks target-language text using the Web Speech API.
// Swappable: replace speak() with a real TTS API call when ready.
// Interface contract: speak() returns Promise<void>, resolves when audio ends.

const LANG_CODES = {
  en: 'en-US',
  he: 'he-IL',
}

export function getLangCode(activeLang) {
  return LANG_CODES[activeLang] ?? activeLang
}

export function speak(text, activeLang = 'en') {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Text-to-speech is not supported in this browser.'))
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang    = getLangCode(activeLang)
    utterance.onend   = () => resolve()
    utterance.onerror = e  => reject(new Error(e.error))
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  })
}
