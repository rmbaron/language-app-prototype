// languages.js — single registry of supported languages.
// Add a new language here and it becomes available throughout the system.
// Nothing else needs to change to register a new language.

export const LANGUAGES = {
  en: {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    script: 'latin',
  },
  he: {
    id: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    direction: 'rtl',
    script: 'hebrew',
  },
}

// Ordered list — determines display order in any language picker UI
export const SUPPORTED_LANGUAGES = [LANGUAGES.en, LANGUAGES.he]

export function getLanguage(id) {
  return LANGUAGES[id] ?? null
}
