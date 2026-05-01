// Subject Shapes — language router
//
// Public API:
//   getSubjectShapes(lang)     → all subject shape records
//   getSubjectShape(id, lang)  → single shape by id, or null

import { SUBJECT_SHAPES as EN_SUBJECT_SHAPES } from './shapes.en.js'

const REGISTRIES = {
  en: EN_SUBJECT_SHAPES,
}

export function getSubjectShapes(lang = 'en') {
  return REGISTRIES[lang] ?? REGISTRIES.en
}

export function getSubjectShape(id, lang = 'en') {
  return getSubjectShapes(lang).find(s => s.id === id) ?? null
}
