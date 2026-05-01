// AI prompt language names
//
// SCOPE: AI prompt building only. Used to interpolate language names into
// AI system prompts ("You are a fully expressive speaker of Spanish").
// English values are intentional — the AI receives instructions in English.
//
// DO NOT USE FOR USER-FACING UI. A Spanish-speaking user's UI should display
// "Inglés", not "English". User-facing language names belong in the string
// table (uiStrings.<lang>.js) per the no-hardcoded-English rule in CLAUDE.md.

export const AI_PROMPT_LANG_NAMES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
}

// Lookup helper. Returns the language code itself as fallback for unknown
// codes — the AI gets a working string either way.
export function aiPromptLangName(code) {
  return AI_PROMPT_LANG_NAMES[code] ?? code
}
