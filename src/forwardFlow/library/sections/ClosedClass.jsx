// Closed-class function-word categories section.
// Reads wordCategories.en.js (the hand-authored finite list) and renders
// a row per category with its word count.

import { WORD_CATEGORIES } from '../../wordCategories.en.js'
import { SchemaSectionHeader, SchemaRow } from './_shared'

const COUNTS = (() => {
  const counts = {}
  for (const cat of Object.values(WORD_CATEGORIES)) {
    counts[cat] = (counts[cat] ?? 0) + 1
  }
  return counts
})()

const TOTAL_WORDS = Object.values(COUNTS).reduce((a, b) => a + b, 0)

export function ClosedClassSection({ open, onToggle }) {
  return (
    <>
      <SchemaSectionHeader
        label="Closed-class function-word categories"
        count={`${Object.keys(COUNTS).length} categories · ${TOTAL_WORDS} words`}
        open={open} onToggle={onToggle} />
      {open && (
        <div style={{ marginBottom: 18 }}>
          {Object.entries(COUNTS).sort().map(([cat, count]) => (
            <SchemaRow key={cat} label={cat} count={count} flag={count > 0 ? 'ok' : 'empty'} />
          ))}
        </div>
      )}
    </>
  )
}
