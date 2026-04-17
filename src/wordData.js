// wordData.js — combined word registry.
// Imports all language-specific word files and exports them as one flat array.
// Everything else in the system imports from here.
//
// To add a new language:
//   1. Create wordData.xx.js with language: 'xx' on every word
//   2. Import it here and spread it into the array below
//   3. Register 'xx' in languages.js
//   Nothing else needs to change.

import enWords from './wordData.en'
import heWords from './wordData.he'

const words = [...enWords, ...heWords]

export default words
