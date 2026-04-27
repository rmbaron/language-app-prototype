// Index entry assembly and search.
// buildIndexEntries() is the single entry point for IndexScreen — call once, memoize.
// searchEntries() does morphology-aware search across all sources.

import { INDEX_SOURCES } from './indexSources.en'
import { resolveToBase } from './morphology.en'

// Returns { entries, byAtom, termIndex, atomWordCounts }
//
// byAtom:         atomId → entry[]  (entry appears under EACH of its atomClasses)
// termIndex:      lowercase term → entry id[]  (for search)
// atomWordCounts: atomId → unique word count  (for chip badges — no double-counting)
export function buildIndexEntries(lang = 'en') {
  const entries = INDEX_SOURCES.flatMap(s => s.getEntries(lang))

  // byAtom — each entry can appear under multiple atoms
  const byAtom = {}
  for (const e of entries) {
    for (const atomClass of e.atomClasses) {
      ;(byAtom[atomClass] ??= []).push(e)
    }
  }
  for (const list of Object.values(byAtom)) {
    list.sort((a, b) => a.surface.localeCompare(b.surface))
  }

  // termIndex — search terms → entry ids
  const termIndex = {}
  function idx(key, id) { ;(termIndex[key.toLowerCase()] ??= new Set()).add(id) }

  for (const e of entries) {
    idx(e.surface, e.id)
    if (e.type === 'word') {
      const base = resolveToBase(e.surface.toLowerCase())
      if (base !== e.surface.toLowerCase()) idx(base, e.id)
    }
    if (e.type === 'construction') {
      for (const kw of e.surface.toLowerCase().split(/\s+/)) idx(kw, e.id)
    }
  }

  // atomWordCounts — unique word entry count per atom (for chip badges)
  const atomWordCounts = {}
  for (const [atomClass, list] of Object.entries(byAtom)) {
    atomWordCounts[atomClass] = new Set(
      list.filter(e => e.type === 'word').map(e => e.id)
    ).size
  }

  return { entries, byAtom, termIndex, atomWordCounts }
}

// Morphology-aware search across all sources.
// Words: matched by surface form or resolved base.
// Constructions: matched by name keywords.
export function searchEntries(query, { entries, termIndex }) {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const base = resolveToBase(q)
  const ids  = new Set([
    ...(termIndex[q]    ? [...termIndex[q]]    : []),
    ...(termIndex[base] ? [...termIndex[base]] : []),
  ])
  return entries.filter(e => ids.has(e.id))
}

// passFilter — applies active filter state to a single entry.
// Constructions: cefrLevel (null = always show), time, aspect.
// Other types:   cefrLevel only (null = always show).
export function passFilter(entry, { cefrFilter, timeFilter, aspectFilter }) {
  if (cefrFilter && entry.cefrLevel !== null && entry.cefrLevel !== cefrFilter) return false
  if (entry.type === 'construction') {
    if (timeFilter   && entry.time   !== timeFilter)   return false
    if (aspectFilter && entry.aspect !== aspectFilter) return false
  }
  return true
}
