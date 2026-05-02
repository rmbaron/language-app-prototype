// Atom-level coverage section.
// For each atom in ATOMS: total word count across all CEFR levels, plus
// a per-level breakdown when expanded. Reads from atomIndex.

import { T } from '../../theme'
import { ATOMS } from '../../../grammarAtoms.en.js'
import { SchemaSectionHeader, SchemaRow } from './_shared'

function groupAtoms() {
  const groups = {}
  for (const atom of ATOMS) {
    const g = atom.group ?? 'Other'
    if (!groups[g]) groups[g] = []
    groups[g].push(atom)
  }
  return Object.entries(groups).map(([label, atoms]) => ({ label, atoms }))
}

export function AtomsSection({ atomIndex, openRows, toggleRow, open, onToggle }) {
  return (
    <>
      <SchemaSectionHeader
        label="Atom-level coverage"
        count={`${ATOMS.length} atoms · ${Object.keys(atomIndex).length} populated`}
        open={open} onToggle={onToggle} />
      {open && (
        <div style={{ marginBottom: 18 }}>
          {groupAtoms().map(({ label, atoms }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: T.textDim, textTransform: 'uppercase', marginBottom: 4 }}>
                {label}
              </div>
              {atoms.map(atom => {
                const buckets = atomIndex[atom.id] ?? {}
                const total = Object.values(buckets).reduce((a, ids) => a + (Array.isArray(ids) ? ids.length : 0), 0)
                const isOpen = !!openRows[`atom-${atom.id}`]
                return (
                  <div key={atom.id}>
                    <SchemaRow
                      label={atom.id}
                      sublabel={atom.label}
                      count={total}
                      flag={total > 0 ? 'ok' : 'empty'}
                      expandable={total > 0}
                      open={isOpen}
                      onToggle={() => toggleRow(`atom-${atom.id}`)} />
                    {isOpen && (
                      <div style={{ marginLeft: 32, marginTop: -2, marginBottom: 6 }}>
                        {Object.entries(buckets).map(([level, ids]) => (
                          <div key={level} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 11, color: T.textSub, padding: '2px 0' }}>
                            <span style={{ fontFamily: 'monospace', minWidth: 36, color: T.textDim }}>{level}</span>
                            <span>{Array.isArray(ids) ? ids.length : 0} word{ids?.length === 1 ? '' : 's'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
