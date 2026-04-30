// Grammar Breaker — L2 Health tab
//
// Shows where the grammar circuit's pattern dependencies meet (or don't
// meet) the L2 enrichment data. For each pattern with `consumesL2Fields`,
// computes coverage: of the words with the pattern's required atom, how
// many have the consumed field populated?
//
// Low coverage = pattern silently under-firing because the L2 data isn't
// there. Surface signal so re-enrichment campaigns can be targeted.

import { useMemo } from 'react'
import { PATTERNS } from './grammarBreakerPatterns'
import { L2_FIELDS } from './L2Fields'
import { getAllWords } from './wordRegistry'

const T = {
  bg:        '#0a1018',
  bgPanel:   '#101822',
  border:    '#1f2a38',
  text:      '#e0e8f0',
  textDim:   '#5a6878',
  label:     '#7a8898',
  good:      '#5fcfd8',
  bad:       '#e85f7a',
  warn:      '#e8a851',
}

// "Field is populated" check. Treats null/undefined as missing; treats false
// as populated (since `false` is a valid enriched value for booleans like
// `properNoun`, `animate`). For booleans where false is the no-info default
// (`colloquial`), this slightly inflates the coverage — acceptable for a
// dashboard signal, not a strict measurement.
function isPopulated(value) {
  return value !== null && value !== undefined
}

// Compute per-atom coverage for every L2 field: how many words with this
// atom have this field populated?
function buildCoverage(words) {
  const cov = {}  // atomId → { total, fields: { fieldName → countWithField } }
  for (const w of words) {
    const atom = w.grammaticalAtom
    if (!atom) continue
    cov[atom] ??= { total: 0, fields: {} }
    cov[atom].total++
    for (const f of L2_FIELDS) {
      cov[atom].fields[f] ??= 0
      if (isPopulated(w[f])) cov[atom].fields[f]++
    }
  }
  return cov
}

function pct(num, den) {
  if (den === 0) return null
  return Math.round((num / den) * 100)
}

function pctColor(p) {
  if (p == null) return T.textDim
  if (p >= 80) return T.good
  if (p >= 50) return T.warn
  return T.bad
}

export default function GrammarBreakerL2Health() {
  const { coverage, words } = useMemo(() => {
    const w = getAllWords('en')
    return { coverage: buildCoverage(w), words: w }
  }, [])

  // Only show grid columns for fields that at least one pattern actually
  // consumes — the full L2_FIELDS list (with metadata fields like cefrLevel,
  // forms, etc.) makes the grid 20+ columns wide and unreadable. Active fields
  // are the load-bearing ones for the grammar circuit.
  const activeFields = useMemo(() => {
    const set = new Set()
    for (const p of PATTERNS) {
      for (const f of p.consumesL2Fields ?? []) set.add(f)
    }
    return [...set].sort()
  }, [])

  // Patterns that consume L2 fields, with their per-pattern coverage:
  //   for each (pattern × consumed field × required atom), compute %
  const patternHealth = useMemo(() => {
    const out = []
    for (const p of PATTERNS) {
      if (!p.consumesL2Fields || p.consumesL2Fields.length === 0) continue
      // Required atoms that aren't function/umbrella atoms — those are the
      // ones we'd expect to carry the L2 fields. If a pattern doesn't
      // declare requiresAtoms (it's alwaysForbidden), use detectsAtoms.
      const reqAtoms = p.license?.requiresAtoms ?? p.detectsAtoms ?? []
      const rows = []
      for (const field of p.consumesL2Fields) {
        // For each (atom, field) pair, compute coverage. Pick worst.
        let worst = null
        let worstAtom = null
        for (const atom of reqAtoms) {
          const total = coverage[atom]?.total ?? 0
          const got   = coverage[atom]?.fields?.[field] ?? 0
          const p     = pct(got, total)
          if (p == null) continue
          if (worst == null || p < worst) { worst = p; worstAtom = atom }
        }
        rows.push({ field, worstPct: worst, worstAtom })
      }
      // Pattern's overall health = lowest field coverage
      const overallWorst = rows.reduce((acc, r) => {
        if (r.worstPct == null) return acc
        return acc == null ? r.worstPct : Math.min(acc, r.worstPct)
      }, null)
      out.push({ patternId: p.id, coupling: p.coupling, forbidden: p.license?.alwaysForbidden,
                 rows, overallWorst })
    }
    return out.sort((a, b) => {
      const aW = a.overallWorst ?? 100
      const bW = b.overallWorst ?? 100
      return aW - bW  // worst first
    })
  }, [coverage])

  // Atom × field grid
  const atoms = useMemo(() => Object.keys(coverage).sort(), [coverage])

  return (
    <div style={{
      background: T.bg, color: T.text,
      padding: 18, borderRadius: 8,
      width: '100%', boxSizing: 'border-box',
      marginTop: 8,
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>L2 Health</div>
        <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>
          Where pattern dependencies meet (or don't meet) the L2 enrichment data.
          {' '}<span style={{ color: T.bad }}>Red &lt;50%</span>: silently under-firing.
          {' '}<span style={{ color: T.warn }}>Amber 50–79%</span>: spotty.
          {' '}<span style={{ color: T.good }}>Teal ≥80%</span>: good. Sorted worst-first.
        </div>
      </div>

      {/* ─── Pattern dependency view ──────────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.label }}>
          Patterns by L2 dependency ({patternHealth.length})
        </div>
        {patternHealth.length === 0 ? (
          <div style={{ color: T.textDim, fontStyle: 'italic', padding: 10, fontSize: 12 }}>
            No patterns declare consumesL2Fields yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {patternHealth.map(ph => (
              <div key={ph.patternId} style={{
                padding: '6px 10px', background: T.bgPanel, borderRadius: 4,
                border: `1px solid ${T.border}`,
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
              }}>
                <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600,
                              color: ph.forbidden ? T.bad : T.text, minWidth: 200 }}>
                  {ph.forbidden ? '✗ ' : ''}{ph.patternId}
                </div>
                <div style={{ fontSize: 10, color: T.textDim, fontFamily: 'monospace', minWidth: 130 }}>
                  {ph.coupling}
                </div>
                <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                  {ph.rows.map(r => (
                    <div key={r.field} style={{
                      fontSize: 10, fontFamily: 'monospace',
                      padding: '1px 6px', borderRadius: 8,
                      border: `1px solid ${pctColor(r.worstPct)}`,
                      color: pctColor(r.worstPct),
                    }}>
                      {r.field}: {r.worstPct == null ? '—' : `${r.worstPct}%`}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Atom × Field grid (only fields actually consumed by patterns) ── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.label }}>
          Coverage grid — atom × L2 field <span style={{ color: T.textDim, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(only fields some pattern consumes)</span>
        </div>
        <div style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 4 }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 10, fontFamily: 'monospace', width: '100%', minWidth: 'max-content' }}>
            <thead>
              <tr>
                <th style={{ padding: '5px 8px', textAlign: 'left', color: T.label, borderBottom: `1px solid ${T.border}`, position: 'sticky', left: 0, background: T.bg, zIndex: 1 }}>atom</th>
                <th style={{ padding: '5px 8px', textAlign: 'right', color: T.label, borderBottom: `1px solid ${T.border}` }}>n</th>
                {activeFields.map(f => (
                  <th key={f} style={{ padding: '5px 8px', textAlign: 'right', color: T.label, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {atoms.map(atom => {
                const row = coverage[atom]
                return (
                  <tr key={atom}>
                    <td style={{ padding: '3px 8px', color: T.text, borderBottom: `1px solid ${T.border}`, position: 'sticky', left: 0, background: T.bg, zIndex: 1, whiteSpace: 'nowrap' }}>{atom}</td>
                    <td style={{ padding: '3px 8px', textAlign: 'right', color: T.textDim, borderBottom: `1px solid ${T.border}` }}>{row.total}</td>
                    {activeFields.map(f => {
                      const got = row.fields[f] ?? 0
                      const p = pct(got, row.total)
                      return (
                        <td key={f} style={{
                          padding: '3px 8px', textAlign: 'right',
                          color: pctColor(p),
                          borderBottom: `1px solid ${T.border}`,
                        }}>
                          {p == null ? '—' : `${p}%`}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 10, color: T.textDim }}>
        {words.length} words sampled · {atoms.length} atoms with primary classification · {activeFields.length} active L2 fields
      </div>
    </div>
  )
}
