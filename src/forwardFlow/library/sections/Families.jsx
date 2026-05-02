// Lemma family coverage section.
// For each family in derivedFormsIndex: expected derivational siblings vs
// actually-seeded members. Loud ⚠ for any expected sibling not yet in seed
// or seeded-but-not-yet-enriched. Reads from derivedFormsIndex +
// featureIndex.lemmaFamily + WORD_SEED.

import { T } from '../../theme'
import { WORD_SEED } from '../../../wordSeed.en'
import { SchemaSectionHeader } from './_shared'

// wordId → baseForm lookup. Built from WORD_SEED at module load.
const SEED_BASE_BY_ID = (() => {
  const m = {}
  for (const w of WORD_SEED) m[w.id] = w.baseForm
  return m
})()
const SEED_ID_SET = new Set(Object.keys(SEED_BASE_BY_ID))

function idFromForm(form) {
  return String(form ?? '').trim().toLowerCase().replace(/\s+/g, '_')
}

export function FamiliesSection({ derivedFormsIndex, familyMembers, openRows, toggleRow, open, onToggle }) {
  const familyCount = Object.keys(derivedFormsIndex).length
  return (
    <>
      <SchemaSectionHeader
        label="Lemma family coverage"
        count={`${familyCount} families with expectations`}
        open={open} onToggle={onToggle} />
      {open && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: T.textDim, fontStyle: 'italic', padding: '4px 12px', marginBottom: 6 }}>
            For each derivational family with expected siblings (e.g. happy → happily, happiness): expected forms vs actually-seeded members. Missing forms get auto-seeded by the enricher; rows here go ✓ as enrichment catches up. ⚠ = expected sibling not in seed yet (or seeded but not enriched, so missing from featureIndex).
          </div>
          {familyCount === 0 && (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: 12, color: T.textDim, fontStyle: 'italic' }}>
              No families with derived-form expectations yet. Enrich a word with a derivational family (e.g. "happy") to populate.
            </div>
          )}
          {Object.entries(derivedFormsIndex)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([root, expected]) => (
              <FamilyRow key={root}
                root={root}
                expected={expected}
                memberIds={familyMembers[root] ?? []}
                open={!!openRows[`fam-${root}`]}
                onToggle={() => toggleRow(`fam-${root}`)} />
            ))}
        </div>
      )}
    </>
  )
}

function FamilyRow({ root, expected, memberIds, open, onToggle }) {
  const memberBaseForms = new Set(
    memberIds.map(id => SEED_BASE_BY_ID[id]).filter(Boolean)
  )
  const expectedBaseForms = expected.map(e => e.form)
  const missingForms = expected.filter(e =>
    !memberBaseForms.has(e.form) && !SEED_ID_SET.has(idFromForm(e.form))
  )
  const seededNotEnriched = expected.filter(e =>
    !memberBaseForms.has(e.form) && SEED_ID_SET.has(idFromForm(e.form))
  )
  const flag = (missingForms.length > 0 || seededNotEnriched.length > 0) ? 'warn' : 'ok'
  const flagDisplay = {
    ok:   { mark: '✓', color: T.green },
    warn: { mark: '⚠', color: T.amber },
  }[flag]

  return (
    <div>
      <div onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'baseline', gap: 10,
          padding: '4px 12px', fontSize: 12,
          borderBottom: `1px dashed ${T.border}`,
          cursor: 'pointer',
        }}>
        <span style={{ color: flagDisplay.color, fontWeight: 700, minWidth: 14 }}>{flagDisplay.mark}</span>
        <span style={{ fontFamily: 'monospace', color: T.text, fontWeight: 600, minWidth: 140 }}>{root}</span>
        <span style={{ color: T.textDim, fontSize: 11, flex: 1 }}>
          {expectedBaseForms.length} expected · {memberBaseForms.size} enriched
          {missingForms.length > 0 && ` · ${missingForms.length} missing from seed`}
          {seededNotEnriched.length > 0 && ` · ${seededNotEnriched.length} seeded, awaiting enrichment`}
        </span>
        <span style={{ fontSize: 10, color: T.textDim, minWidth: 12 }}>{open ? '▴' : '▾'}</span>
      </div>
      {open && (
        <div style={{ marginLeft: 32, marginBottom: 6 }}>
          {expected.map(e => {
            const isEnriched = memberBaseForms.has(e.form)
            const isSeeded   = SEED_ID_SET.has(idFromForm(e.form))
            const status = isEnriched ? 'enriched'
                         : isSeeded   ? 'seeded'
                         : 'missing'
            const color = status === 'enriched' ? T.green
                        : status === 'seeded'   ? T.amber
                        : T.red
            const mark = status === 'enriched' ? '✓'
                       : status === 'seeded'   ? '◷'
                       : '✗'
            const note = status === 'enriched' ? 'enriched'
                       : status === 'seeded'   ? 'in seed, awaiting L2 enrichment'
                       : 'not in seed (auto-seeder will add on next enrichment)'
            return (
              <div key={`${e.form}::${e.category}`} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 11, padding: '2px 0' }}>
                <span style={{ color, fontWeight: 700, minWidth: 14 }}>{mark}</span>
                <span style={{ fontFamily: 'monospace', color: T.text, minWidth: 140 }}>{e.form}</span>
                <span style={{ color: T.textDim, minWidth: 70 }}>{e.category}</span>
                <span style={{ color, fontStyle: 'italic' }}>{note}</span>
              </div>
            )
          })}
          {memberBaseForms.size > 0 && (
            <div style={{ fontSize: 10, color: T.textDim, padding: '4px 0', marginTop: 4, borderTop: `1px dashed ${T.border}` }}>
              Enriched members: {[...memberBaseForms].sort().join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
