// Exception Shapes — language router
//
// Public API:
//   getExceptionShapes(lang)     → all exception shape records
//   getExceptionShape(id, lang)  → single shape by id, or null

import { EXCEPTION_SHAPES as EN_EXCEPTION_SHAPES } from './shapes.en.js'

const REGISTRIES = {
  en: EN_EXCEPTION_SHAPES,
}

export function getExceptionShapes(lang = 'en') {
  return REGISTRIES[lang] ?? REGISTRIES.en
}

export function getExceptionShape(id, lang = 'en') {
  return getExceptionShapes(lang).find(s => s.id === id) ?? null
}
