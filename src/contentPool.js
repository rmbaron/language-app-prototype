// Content Pool — IndexedDB-backed pool of tagged sentences for word practice mechanics.
//
// Design principles:
//   - Content-first: the sentence is the source of truth. wordIds are tags on the entry,
//     not its identity. Same sentence can serve multiple words.
//   - Text is immutable. Tags are mutable and grow as the system learns more.
//   - contentHash = hash(text). Deduplication key — same sentence never ingested twice.
//   - All operations are async (IndexedDB requirement).
//
// Entry shape:
//   {
//     id: string (uuid),
//     contentHash: string,
//     text: string,                          // immutable
//     lang: string,                          // target language ('en', etc.)
//     wordIds: string[],                     // all words this entry is tagged to
//     wordAnnotations: {                     // per-word data
//       [wordId]: {
//         targetForm: string,                // which inflection appears in text
//         wordSpan: { start: number, end: number },
//         targetIsBlankable: boolean,
//       }
//     },
//     clusterFloor: number,                  // min cluster to comprehend
//     clusterCeiling: number,                // highest structure present
//     cefrLevel: string,
//     themes: string[],
//     properties: {                          // sentence-level
//       hasMultipleForms: boolean,           // target appears in multiple forms
//       structureIsLabeled: boolean,         // slot roles have been tagged
//       isDialogue: boolean,
//       sentenceCount: number,
//     },
//     source: 'flywheel' | 'ingested' | 'authored',
//     sourceContext: { lane: string | null, promptTheme: string | null },
//     status: 'pending' | 'approved' | 'rejected',
//     createdAt: number,
//     approvedAt: number | null,
//     timesUsed: number,
//     timesCorrect: number,
//   }

const DB_NAME = 'lapp-content-pool'
const DB_VERSION = 1
const STORE = 'entries'

let _db = null

function openDB() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = e => {
      const db = e.target.result
      const store = db.createObjectStore(STORE, { keyPath: 'id' })

      // wordIds is an array — multiEntry lets you query by any single wordId
      store.createIndex('byWordId', 'wordIds', { multiEntry: true })
      store.createIndex('byHash', 'contentHash', { unique: true })
      store.createIndex('byStatus', 'status')
      store.createIndex('byLang', 'lang')
    }

    req.onsuccess = e => { _db = e.target.result; resolve(_db) }
    req.onerror = e => reject(e.target.error)
  })
}

function tx(mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const store = t.objectStore(STORE)
    const req = fn(store)
    if (req) {
      req.onsuccess = e => resolve(e.target.result)
      req.onerror = e => reject(e.target.error)
    } else {
      t.oncomplete = () => resolve()
      t.onerror = e => reject(e.target.error)
    }
  }))
}

// ── Hashing ───────────────────────────────────────────────────────────────────

export async function hashText(text) {
  const encoded = new TextEncoder().encode(text.trim().toLowerCase())
  const buf = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateId() {
  return crypto.randomUUID()
}

// ── Write ─────────────────────────────────────────────────────────────────────

// Upsert by contentHash.
// If hash exists: update mutable fields (tags, annotations, properties) in place.
// If hash not found: write new entry with status 'pending'.
// text and createdAt are never overwritten on an existing entry.
export async function putEntry(entry) {
  const hash = await hashText(entry.text)
  const existing = await getEntryByHash(hash)

  if (existing) {
    const updated = {
      ...existing,
      wordIds: entry.wordIds ?? existing.wordIds,
      wordAnnotations: { ...existing.wordAnnotations, ...entry.wordAnnotations },
      clusterFloor: entry.clusterFloor ?? existing.clusterFloor,
      clusterCeiling: entry.clusterCeiling ?? existing.clusterCeiling,
      cefrLevel: entry.cefrLevel ?? existing.cefrLevel,
      themes: entry.themes ?? existing.themes,
      properties: { ...existing.properties, ...entry.properties },
      sourceContext: entry.sourceContext ?? existing.sourceContext,
    }
    return tx('readwrite', store => store.put(updated))
  }

  const newEntry = {
    id: generateId(),
    contentHash: hash,
    text: entry.text,
    lang: entry.lang,
    wordIds: entry.wordIds ?? [],
    wordAnnotations: entry.wordAnnotations ?? {},
    clusterFloor: entry.clusterFloor ?? 0,
    clusterCeiling: entry.clusterCeiling ?? 0,
    cefrLevel: entry.cefrLevel ?? null,
    themes: entry.themes ?? [],
    properties: {
      hasMultipleForms: false,
      structureIsLabeled: false,
      isDialogue: false,
      sentenceCount: 1,
      ...entry.properties,
    },
    source: entry.source ?? 'ingested',
    sourceContext: entry.sourceContext ?? { lane: null, promptTheme: null },
    status: 'pending',
    createdAt: Date.now(),
    approvedAt: null,
    timesUsed: 0,
    timesCorrect: 0,
  }

  return tx('readwrite', store => store.add(newEntry))
}

export async function updateEntry(id, patches) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readwrite')
    const store = t.objectStore(STORE)
    const getReq = store.get(id)
    getReq.onsuccess = e => {
      const entry = e.target.result
      if (!entry) { reject(new Error(`Entry ${id} not found`)); return }
      const updated = { ...entry, ...patches }
      if (patches.status === 'approved' && !entry.approvedAt) {
        updated.approvedAt = Date.now()
      }
      store.put(updated)
      t.oncomplete = () => resolve(updated)
      t.onerror = e => reject(e.target.error)
    }
    getReq.onerror = e => reject(e.target.error)
  })
}

export async function bulkUpdateEntries(ids, patches) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readwrite')
    const store = t.objectStore(STORE)
    let pending = ids.length
    if (pending === 0) { resolve([]); return }
    const results = []
    ids.forEach(id => {
      const getReq = store.get(id)
      getReq.onsuccess = e => {
        const entry = e.target.result
        if (!entry) { pending--; if (pending === 0) resolve(results); return }
        const updated = { ...entry, ...patches }
        if (patches.status === 'approved' && !entry.approvedAt) {
          updated.approvedAt = Date.now()
        }
        store.put(updated)
        results.push(updated)
        pending--
        if (pending === 0) resolve(results)
      }
      getReq.onerror = e => reject(e.target.error)
    })
    t.onerror = e => reject(e.target.error)
  })
}

// ── Read ──────────────────────────────────────────────────────────────────────

export function getEntry(id) {
  return tx('readonly', store => store.get(id))
}

export function getEntryByHash(hash) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readonly')
    const req = t.objectStore(STORE).index('byHash').get(hash)
    req.onsuccess = e => resolve(e.target.result ?? null)
    req.onerror = e => reject(e.target.error)
  }))
}

// Returns all approved entries tagged to a wordId, optionally filtered.
// filters: { clusterFloor, clusterCeiling, themes, properties, targetForm }
export async function queryByWord(wordId, lang, filters = {}) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readonly')
    const req = t.objectStore(STORE).index('byWordId').getAll(wordId)
    req.onsuccess = e => {
      let entries = e.target.result.filter(entry => {
        if (entry.lang !== lang) return false
        if (entry.status !== 'approved') return false
        if (filters.clusterFloor != null && entry.clusterCeiling < filters.clusterFloor) return false
        if (filters.clusterCeiling != null && entry.clusterFloor > filters.clusterCeiling) return false
        if (filters.targetForm) {
          const ann = entry.wordAnnotations?.[wordId]
          if (!ann || ann.targetForm !== filters.targetForm) return false
        }
        if (filters.properties) {
          for (const [k, v] of Object.entries(filters.properties)) {
            if (entry.properties?.[k] !== v) return false
          }
        }
        return true
      })

      if (filters.themes?.length) {
        entries = entries.sort((a, b) => {
          const scoreA = a.themes.filter(t => filters.themes.includes(t)).length
          const scoreB = b.themes.filter(t => filters.themes.includes(t)).length
          return scoreB - scoreA
        })
      }

      resolve(entries)
    }
    req.onerror = e => reject(e.target.error)
  })
}

// Count approved entries for a word — used by mechanic availableIf checks.
export async function countApprovedForWord(wordId, lang, filters = {}) {
  const entries = await queryByWord(wordId, lang, filters)
  return entries.length
}

// ── Dev tools ─────────────────────────────────────────────────────────────────

// Browse the full pool. filters: { status, lang, wordId, source }
export async function getAllEntries(filters = {}) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readonly')
    const req = t.objectStore(STORE).getAll()
    req.onsuccess = e => {
      let entries = e.target.result
      if (filters.status) entries = entries.filter(e => e.status === filters.status)
      if (filters.lang) entries = entries.filter(e => e.lang === filters.lang)
      if (filters.wordId) entries = entries.filter(e => e.wordIds.includes(filters.wordId))
      if (filters.source) entries = entries.filter(e => e.source === filters.source)
      resolve(entries)
    }
    req.onerror = e => reject(e.target.error)
  })
}

export async function getPoolStats(lang) {
  const all = await getAllEntries(lang ? { lang } : {})
  return {
    total: all.length,
    pending: all.filter(e => e.status === 'pending').length,
    approved: all.filter(e => e.status === 'approved').length,
    rejected: all.filter(e => e.status === 'rejected').length,
  }
}

// Returns wordIds that have fewer than minApproved approved entries.
export async function getPoolGaps(lang, minApproved = 1) {
  const approved = await getAllEntries({ lang, status: 'approved' })
  const counts = {}
  for (const entry of approved) {
    for (const wordId of entry.wordIds) {
      counts[wordId] = (counts[wordId] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .filter(([, count]) => count < minApproved)
    .map(([wordId]) => wordId)
}

export async function exportPool(filters = {}) {
  return getAllEntries(filters)
}

export function deleteEntry(id) {
  return tx('readwrite', store => store.delete(id))
}

export async function bulkDeleteEntries(ids) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readwrite')
    const store = t.objectStore(STORE)
    ids.forEach(id => store.delete(id))
    t.oncomplete = () => resolve()
    t.onerror = e => reject(e.target.error)
  })
}

export async function clearPool(lang) {
  const all = await getAllEntries(lang ? { lang } : {})
  return bulkDeleteEntries(all.map(e => e.id))
}

export async function importPool(entries) {
  const results = { imported: 0, skipped: 0 }
  for (const entry of entries) {
    const hash = await hashText(entry.text)
    const existing = await getEntryByHash(hash)
    if (existing) { results.skipped++; continue }
    await putEntry({ ...entry, contentHash: hash })
    results.imported++
  }
  return results
}
