// Index Sources — English
//
// The registry of every classification source in the system.
// Adding a new source = one new entry here. IndexScreen never imports sources directly.
//
// Entry shape:
//   id, surface, type, atomClasses[], cefrLevel, sourceId, lang, isPioneer
//   + constructions: pattern, spaceCount, time, aspect, example

import { SYSTEM_WORDS } from './systemWords.en'
import { FIXED_UNITS } from './multiWordUnits.en'
import { ALWAYS_PASS_WORDS } from './circuitCheck'
import { TENSE_GRID } from './tenseGrid.en'
import { getAtomPioneer } from './atomPioneers'

function systemWordEntries(lang) {
  const entries = []
  for (const [cefrLevel, atomMap] of Object.entries(SYSTEM_WORDS)) {
    for (const [atomClass, words] of Object.entries(atomMap)) {
      for (const word of words) {
        entries.push({
          id:          `${lang}-${word}`,
          surface:     word,
          type:        'word',
          atomClasses: [atomClass],
          cefrLevel,
          sourceId:    'system_words',
          lang,
          isPioneer:   getAtomPioneer(atomClass, lang) === word,
        })
      }
    }
  }
  return entries
}

function fixedUnitEntries(lang) {
  return FIXED_UNITS.map(u => ({
    id:          `fixed-${u.id}`,
    surface:     u.text,
    type:        'fixed_unit',
    atomClasses: [u.atomClass],
    cefrLevel:   null,
    sourceId:    'fixed_units',
    lang,
    isPioneer:   false,
  }))
}

function alwaysPassEntries(lang) {
  return ALWAYS_PASS_WORDS.map(w => ({
    id:          `always-${w.word}`,
    surface:     w.word,
    type:        'always_pass',
    atomClasses: [w.atomClass],
    cefrLevel:   null,
    sourceId:    'always_pass',
    lang,
    isPioneer:   false,
  }))
}

function constructionEntries(lang) {
  return TENSE_GRID.map(t => ({
    id:          `construction-${t.id}`,
    surface:     t.name,
    type:        'construction',
    atomClasses: t.atoms,
    cefrLevel:   t.cefrLevel ?? null,
    sourceId:    'constructions',
    lang,
    isPioneer:   false,
    pattern:     t.structure,
    spaceCount:  t.spaceCount,
    time:        t.time,
    aspect:      t.aspect,
    example:     t.example,
  }))
}

export const INDEX_SOURCES = [
  { id: 'system_words',  label: 'System vocabulary',         getEntries: systemWordEntries  },
  { id: 'fixed_units',   label: 'Multi-word units',          getEntries: fixedUnitEntries   },
  { id: 'always_pass',   label: 'Circuit always-pass',       getEntries: alwaysPassEntries  },
  { id: 'constructions', label: 'Grammatical constructions', getEntries: constructionEntries },
]
