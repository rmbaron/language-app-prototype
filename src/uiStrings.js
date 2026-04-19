// UI string router — returns the right string table for the interface language.
//
// Usage in any component:
//   import { getStrings } from './uiStrings'
//   import { getInterfaceLanguage } from './learnerProfile'
//   const s = getStrings(getInterfaceLanguage())
//
// Adding a new interface language:
//   1. Create src/uiStrings.{code}.js mirroring uiStrings.en.js
//   2. Import it below and add to STRINGS

import en from './uiStrings.en'

const STRINGS = {
  en,
  // es: es,  — add when Spanish UI is authored
  // he: he,  — add when Hebrew UI is authored
}

// Returns the string table for the given language code.
// Falls back to English if the language isn't available yet.
export function getStrings(lang = 'en') {
  return STRINGS[lang] ?? STRINGS.en
}
