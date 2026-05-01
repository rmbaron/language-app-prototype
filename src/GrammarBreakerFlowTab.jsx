// Grammar Breaker — Flow tab
//
// A circuit-board-style visualization of how complexity flows up through the
// four levels of the grammar architecture:
//
//   Column 1 — Atoms (Level 1)        — single grammatical types
//   Column 2 — Micro-patterns (Level 2) — atomic structural shapes
//   Column 3 — Micro-structures (Level 3) — couplings; concepts the patterns implement
//   Column 4 — Composites (Level 4)   — bigger structural shapes built from couplings
//
// Click any item to light up its connections across all columns. Default state
// is dim — nothing is loud unless you're exploring it.
//
// Word picker at the top: type-and-select a single word to enter the flow from
// that word's atoms. No bulk word list ever rendered.

import { useState, useMemo } from 'react'
import { getAtoms } from './grammarAtoms'
import { isOpenClass } from './atomGroups.en'
import { PATTERNS } from './grammarBreakerPatterns'
import { COUPLINGS, COMPOSITES } from './grammarBreakerCouplings'
import { getAllWords } from './wordRegistry'
import { validateSentence } from './grammarBreaker'

// ── Theme ───────────────────────────────────────────────────────────────────

const F = {
  bg:        '#0a1018',
  bgPanel:   '#101822',
  border:    '#1f2a38',
  text:      '#e0e8f0',
  textDim:   '#5a6878',
  label:     '#7a8898',

  // Atom colors
  closedAtom: '#5fcfd8',  // teal — closed-class atoms
  openAtom:   '#e8a851',  // amber — open-class atoms

  // Pattern colors
  allowed:   '#5fcfd8',
  forbidden: '#e85f7a',

  // Coupling color
  coupling:  '#a87fdb',  // violet

  // Composite color
  composite: '#7fdb9f',  // green

  // Glow
  glow:      'rgba(95, 207, 216, 0.25)',
}

// ── SVG building blocks ─────────────────────────────────────────────────────

function AtomShape({ color, lit, size = 56 }) {
  const opacity = lit ? 1 : 0.28
  const r       = size / 2
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ opacity, transition: 'opacity 200ms' }}>
      {/* Three crossing orbital ellipses */}
      <ellipse cx="30" cy="30" rx="26" ry="9" fill="none" stroke={color} strokeWidth="1.2" strokeOpacity="0.55" />
      <ellipse cx="30" cy="30" rx="26" ry="9" fill="none" stroke={color} strokeWidth="1.2" strokeOpacity="0.55" transform="rotate(60 30 30)" />
      <ellipse cx="30" cy="30" rx="26" ry="9" fill="none" stroke={color} strokeWidth="1.2" strokeOpacity="0.55" transform="rotate(-60 30 30)" />
      {/* Glow halo when lit */}
      {lit && <circle cx="30" cy="30" r="22" fill={color} fillOpacity="0.10" />}
      {/* Nucleus */}
      <circle cx="30" cy="30" r="6" fill={color} />
    </svg>
  )
}

function MoleculeShape({ atomCount, color, lit, forbidden }) {
  const opacity = lit ? 1 : 0.28
  const stroke  = forbidden ? F.forbidden : color
  const fill    = forbidden ? F.forbidden : color
  const dotR    = 6
  const gap     = 30
  const w       = 30 + (atomCount - 1) * gap
  return (
    <svg width={w} height="40" style={{ opacity, transition: 'opacity 200ms', display: 'block' }}>
      {Array.from({ length: atomCount - 1 }, (_, i) => (
        <line key={`l${i}`} x1={15 + i * gap + dotR} y1="20" x2={15 + (i + 1) * gap - dotR} y2="20"
              stroke={stroke} strokeWidth="1.5" strokeOpacity="0.7" />
      ))}
      {Array.from({ length: atomCount }, (_, i) => (
        <circle key={`c${i}`} cx={15 + i * gap} cy="20" r={dotR} fill={fill} />
      ))}
      {lit && <rect x="0" y="0" width={w} height="40" fill={fill} fillOpacity="0.06" rx="4" />}
    </svg>
  )
}

function HexagonShape({ color, lit, size = 60 }) {
  const opacity = lit ? 1 : 0.28
  const r       = size / 2
  const cx      = r
  const cy      = r
  const points  = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
  return (
    <svg width={size} height={size} style={{ opacity, transition: 'opacity 200ms', display: 'block' }}>
      {lit && <polygon points={points} fill={color} fillOpacity="0.10" />}
      <polygon points={points} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.85" />
      <circle cx={cx} cy={cy} r="3" fill={color} />
    </svg>
  )
}

function CompositeShape({ color, lit, count }) {
  const opacity = lit ? 1 : 0.28
  return (
    <svg width="84" height="56" style={{ opacity, transition: 'opacity 200ms', display: 'block' }}>
      {lit && <rect x="2" y="2" width="80" height="52" fill={color} fillOpacity="0.10" rx="10" />}
      <rect x="2" y="2" width="80" height="52" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.85" rx="10" />
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} cx={14 + i * 14} cy="28" r="3.5" fill={color} fillOpacity="0.85" />
      ))}
    </svg>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

// Pulls the first quoted phrase after "e.g." from a pattern's description.
// Returns null if no example is found. Used to surface a tiny inline example
// on red (forbidden) pattern cells so the user can see at-a-glance why the
// pattern flags broken English.
function extractFirstExample(description) {
  if (!description) return null
  const match = description.match(/e\.g\.\s*"([^"]+)"/i)
  return match ? match[1] : null
}

function atomsForPattern(pattern) {
  // Allowed patterns expose atoms via license.requiresAtoms.
  // Forbidden patterns expose atoms via the explicit `detectsAtoms` field
  // — these are atoms the detector inspects internally even though the
  // license isn't gated on them.
  const required = pattern?.license?.requiresAtoms ?? []
  const detected = pattern?.detectsAtoms ?? []
  return new Set([...required, ...detected])
}

function patternsForAtom(atomId) {
  return PATTERNS.filter(p => atomsForPattern(p).has(atomId))
}

function patternsForCoupling(couplingId) {
  return PATTERNS.filter(p => p.coupling === couplingId)
}

function compositesForCoupling(couplingId) {
  return COMPOSITES.filter(c => c.couplings.includes(couplingId))
}

// Returns the resolved atom-id set for a word (primary + alternateAtoms).
function atomsForWord(word) {
  if (!word) return new Set()
  const out = new Set()
  if (word.grammaticalAtom) out.add(word.grammaticalAtom)
  for (const a of word.alternateAtoms ?? []) if (a?.atom) out.add(a.atom)
  return out
}

// ── Column components ──────────────────────────────────────────────────────

function ColumnHeader({ level, title, subtitle, count }) {
  return (
    <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${F.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: F.label, textTransform: 'uppercase' }}>
        Level {level}
      </div>
      <div style={{ fontSize: 14, color: F.text, fontWeight: 600, marginTop: 4 }}>
        {title}{count != null && <span style={{ color: F.textDim, fontWeight: 400, marginLeft: 6 }}>({count})</span>}
      </div>
      {subtitle && <div style={{ fontSize: 11, color: F.textDim, marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>}
    </div>
  )
}

function Cell({ children, lit, onClick, title }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        border: 'none', padding: '8px 4px',
        cursor: 'pointer', borderRadius: 6,
        outline: lit ? `1px solid ${F.border}` : 'none',
        background: lit ? F.bgPanel : 'transparent',
        transition: 'background 200ms, outline 200ms, transform 300ms ease',
      }}>
      {children}
    </button>
  )
}

function ClickableId({ color, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{
        background: 'transparent', border: 'none', padding: 0,
        color, fontFamily: 'monospace', fontWeight: 600,
        cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted',
        textUnderlineOffset: 3, fontSize: 'inherit',
      }}>
      {children}
    </button>
  )
}

function WarnBadge({ children }) {
  return (
    <span style={{
      display: 'inline-block', padding: '1px 6px', fontSize: 9,
      background: 'rgba(232, 95, 122, 0.15)', color: F.forbidden,
      border: `1px solid ${F.forbidden}`, borderRadius: 8,
      letterSpacing: '0.04em',
    }}>
      {children}
    </span>
  )
}

function CellLabel({ text, lit, color = F.text, mono = false }) {
  return (
    <div style={{
      fontSize: 11, color: lit ? color : F.textDim,
      fontFamily: mono ? 'monospace' : 'inherit',
      maxWidth: 110, textAlign: 'center', lineHeight: 1.3,
      transition: 'color 200ms',
      wordBreak: 'break-word',
    }}>
      {text}
    </div>
  )
}

// ── Rejection panel — explain why the typed sentence was rejected ──────────

// Renders one row per failure with whatever information the validator
// produced. Coverage gaps, forbidden-pattern matches, and missing-required-
// atom failures all get the same shape: reason + offending surface span.
function RejectionPanel({ signature, onPickPattern }) {
  const { failures, tokens } = signature

  // Recompose the surface text for a token-index span [a, b].
  function spanText(span) {
    if (!span || tokens == null) return ''
    const [a, b] = span
    const out = []
    for (let i = a; i <= b && i < tokens.length; i++) out.push(tokens[i].surface)
    return out.join(' ')
  }

  function failureLabel(f) {
    if (f.patternId === '_coverage_gap') return 'coverage gap'
    return f.patternId
  }

  function failureReason(f) {
    if (f.patternId === '_coverage_gap') {
      const tokens = f.info?.uncoveredTokens ?? []
      const surfaces = tokens.map(t => `"${t.surface}"`).join(', ')
      return `no allowed pattern licenses ${surfaces} — the sentence is incomplete or uses a structure the circuit doesn't yet recognize`
    }
    return f.reason ?? 'no reason provided'
  }

  return (
    <div style={{
      marginTop: 8, padding: '10px 14px',
      background: 'rgba(232, 95, 122, 0.06)',
      border: `1px solid ${F.forbidden}`, borderRadius: 6,
      fontSize: 12, color: F.text, lineHeight: 1.55,
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.12em', color: F.forbidden, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
        Why rejected
      </div>
      {failures.length === 0 ? (
        <div style={{ color: F.textDim, fontStyle: 'italic' }}>
          allowed = false but no failure recorded — this shouldn't happen, please flag
        </div>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {failures.map((f, i) => {
            const surface = spanText(f.span)
            const isCoverageGap = f.patternId === '_coverage_gap'
            return (
              <li key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
                <span style={{ color: F.forbidden, fontWeight: 700 }}>✗</span>
                {isCoverageGap ? (
                  <span style={{ fontFamily: 'monospace', color: F.forbidden, fontWeight: 600 }}>
                    {failureLabel(f)}
                  </span>
                ) : (
                  <button
                    onClick={() => onPickPattern(f.patternId)}
                    style={{
                      background: 'transparent', border: 'none', padding: 0,
                      color: F.forbidden, fontFamily: 'monospace', fontWeight: 600,
                      cursor: 'pointer', textDecoration: 'underline',
                      textDecorationStyle: 'dotted', textUnderlineOffset: 3,
                      fontSize: 'inherit',
                    }}
                  >
                    {failureLabel(f)}
                  </button>
                )}
                {surface && (
                  <span style={{ color: F.textDim }}>
                    at <span style={{ color: F.text, fontStyle: 'italic' }}>"{surface}"</span>
                  </span>
                )}
                <span style={{ color: F.textDim, flexBasis: '100%', paddingLeft: 18 }}>
                  {failureReason(f)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export default function GrammarBreakerFlowTab({ activeAtoms = [] }) {
  const atoms = getAtoms('en')

  // Selection state — at most one column "owns" the active selection.
  const [selectedAtom,     setSelectedAtom]     = useState(null)
  const [selectedPattern,  setSelectedPattern]  = useState(null)
  const [selectedCoupling, setSelectedCoupling] = useState(null)
  const [selectedComposite,setSelectedComposite]= useState(null)

  // Word picker
  const [wordQuery,     setWordQuery]     = useState('')
  const [selectedWord,  setSelectedWord]  = useState(null)

  // Sentence input — type a full sentence and see its signature flow up
  const [sentence, setSentence] = useState('')

  // Toggles
  const [showActiveAtoms, setShowActiveAtoms] = useState(false)  // off by default; Flow is for architecture, not simulation
  const [groupByCoupling, setGroupByCoupling] = useState(false)  // off by default; preserve declaration order

  function clearSelection() {
    setSelectedAtom(null); setSelectedPattern(null)
    setSelectedCoupling(null); setSelectedComposite(null)
    setSelectedWord(null); setWordQuery('')
    setSentence('')
  }

  // ── Sentence signature ──────────────────────────────────────────────
  // When the user types a sentence, we run it through the validator with
  // ALL atoms active so every applicable pattern can fire. The result is
  // the sentence's "signature" in the architecture — every atom present,
  // every pattern that fires, every coupling those patterns implement.
  const sentenceSignature = useMemo(() => {
    if (!sentence.trim()) return null
    const allAtomIds = atoms.map(a => a.id)
    const result = validateSentence(sentence, allAtomIds, 'en')
    const atomSet = new Set()
    const patternSet = new Set()
    const couplingSet = new Set()
    const compositeSet = new Set()
    const unknownTokens = []
    const atomlessTokens = []
    for (const t of result.tokens) {
      if (t.isPunctuation) continue
      if (t.isUnknown) { unknownTokens.push(t.surface); continue }
      if (!t.isFunctionWord && (!t.atoms || t.atoms.length === 0)) {
        atomlessTokens.push(t.surface)
      }
      if (Array.isArray(t.atoms)) for (const a of t.atoms) atomSet.add(a)
    }
    for (const f of result.fired) {
      if (!f.verdict.allowed) continue
      patternSet.add(f.patternId)
      const p = PATTERNS.find(x => x.id === f.patternId)
      if (p) {
        couplingSet.add(p.coupling)
        compositesForCoupling(p.coupling).forEach(c => compositeSet.add(c.id))
      }
    }
    // Forbidden patterns that fired — light them up in the Guards section so
    // the user can SEE which tripwire matched.
    const firedForbidden = new Set()
    for (const f of result.fired) {
      if (f.verdict.allowed) continue
      firedForbidden.add(f.patternId)
      patternSet.add(f.patternId)  // also light its chip
    }
    return {
      atomSet, patternSet, couplingSet, compositeSet,
      fired: result.fired, failures: result.failures,
      allowed: result.allowed,
      tokens: result.tokens,
      unknownTokens, atomlessTokens,
      firedForbidden,
    }
  }, [sentence, atoms])

  // ── Lit-up sets per column ──────────────────────────────────────────
  // Compute which items in each column should be highlighted given the
  // current selection. Anything not in these sets is dimmed.
  // Priority: single-item selection > sentence signature > nothing.
  const lit = useMemo(() => {
    let atomSet      = new Set()
    let patternSet   = new Set()
    let couplingSet  = new Set()
    let compositeSet = new Set()

    if (selectedWord) {
      atomSet = atomsForWord(selectedWord)
      const ps = PATTERNS.filter(p => {
        const need = atomsForPattern(p)
        return [...atomSet].some(a => need.has(a))
      })
      ps.forEach(p => patternSet.add(p.id))
      ps.forEach(p => couplingSet.add(p.coupling))
      ps.forEach(p => compositesForCoupling(p.coupling).forEach(c => compositeSet.add(c.id)))
    } else if (selectedAtom) {
      atomSet.add(selectedAtom)
      const ps = patternsForAtom(selectedAtom)
      ps.forEach(p => patternSet.add(p.id))
      ps.forEach(p => couplingSet.add(p.coupling))
      ps.forEach(p => compositesForCoupling(p.coupling).forEach(c => compositeSet.add(c.id)))
    } else if (selectedPattern) {
      const p = PATTERNS.find(x => x.id === selectedPattern)
      if (p) {
        patternSet.add(p.id)
        atomsForPattern(p).forEach(a => atomSet.add(a))
        couplingSet.add(p.coupling)
        compositesForCoupling(p.coupling).forEach(c => compositeSet.add(c.id))
      }
    } else if (selectedCoupling) {
      couplingSet.add(selectedCoupling)
      const ps = patternsForCoupling(selectedCoupling)
      ps.forEach(p => patternSet.add(p.id))
      ps.forEach(p => atomsForPattern(p).forEach(a => atomSet.add(a)))
      compositesForCoupling(selectedCoupling).forEach(c => compositeSet.add(c.id))
    } else if (selectedComposite) {
      const comp = COMPOSITES.find(c => c.id === selectedComposite)
      if (comp) {
        compositeSet.add(comp.id)
        comp.couplings.forEach(cid => couplingSet.add(cid))
        comp.couplings.forEach(cid => {
          patternsForCoupling(cid).forEach(p => {
            patternSet.add(p.id)
            atomsForPattern(p).forEach(a => atomSet.add(a))
          })
        })
      }
    } else if (sentenceSignature) {
      atomSet      = sentenceSignature.atomSet
      patternSet   = sentenceSignature.patternSet
      couplingSet  = sentenceSignature.couplingSet
      compositeSet = sentenceSignature.compositeSet
    }

    return { atomSet, patternSet, couplingSet, compositeSet }
  }, [selectedAtom, selectedPattern, selectedCoupling, selectedComposite, selectedWord, sentenceSignature])

  const anySelection = !!(selectedAtom || selectedPattern || selectedCoupling || selectedComposite || selectedWord || sentenceSignature)

  // ── Sorted column items: lit items rise to the top ─────────────────────
  // Position-switching replaces SVG connection lines — when something is
  // selected, related items physically move to the top of their columns,
  // making the connection visible without drawing across columns.
  const activeAtomSet = useMemo(() => new Set(activeAtoms), [activeAtoms])

  const sortedAtoms = useMemo(() => {
    if (!anySelection) return atoms
    return [...atoms].sort((a, b) => {
      const aLit = lit.atomSet.has(a.id) ? 0 : 1
      const bLit = lit.atomSet.has(b.id) ? 0 : 1
      return aLit - bLit
    })
  }, [atoms, lit, anySelection])

  // Patterns are split into allowed and forbidden because they're conceptually
  // opposite kinds of things. Allowed patterns LICENSE structure ("this is
  // why your sentence works"); forbidden patterns FLAG broken English ("this
  // is why your sentence is rejected"). Visualizing them as siblings was
  // misleading. Split — sort each group by lit status (lit first) so a fired
  // pattern still rises within its section.
  function sortByLitOnly(arr) {
    if (!anySelection) return arr
    return [...arr].sort((a, b) => {
      const aLit = lit.patternSet.has(a.id) ? 0 : 1
      const bLit = lit.patternSet.has(b.id) ? 0 : 1
      return aLit - bLit
    })
  }
  const sortedAllowedPatterns = useMemo(() => {
    let arr = PATTERNS.filter(p => !p.license?.alwaysForbidden)
    if (groupByCoupling) arr = [...arr].sort((a, b) => a.coupling.localeCompare(b.coupling))
    return sortByLitOnly(arr)
  }, [lit, anySelection, groupByCoupling])
  const sortedForbiddenPatterns = useMemo(() => {
    let arr = PATTERNS.filter(p => p.license?.alwaysForbidden)
    if (groupByCoupling) arr = [...arr].sort((a, b) => a.coupling.localeCompare(b.coupling))
    return sortByLitOnly(arr)
  }, [lit, anySelection, groupByCoupling])

  const sortedCouplings = useMemo(() => {
    if (!anySelection) return COUPLINGS
    return [...COUPLINGS].sort((a, b) => {
      const aLit = lit.couplingSet.has(a.id) ? 0 : 1
      const bLit = lit.couplingSet.has(b.id) ? 0 : 1
      return aLit - bLit
    })
  }, [lit, anySelection])

  const sortedComposites = useMemo(() => {
    if (!anySelection) return COMPOSITES
    return [...COMPOSITES].sort((a, b) => {
      const aLit = lit.compositeSet.has(a.id) ? 0 : 1
      const bLit = lit.compositeSet.has(b.id) ? 0 : 1
      return aLit - bLit
    })
  }, [lit, anySelection])

  // ── Word picker matches ─────────────────────────────────────────────
  const wordMatches = useMemo(() => {
    const q = wordQuery.trim().toLowerCase()
    if (!q) return []
    const all = getAllWords('en').filter(w => w?.baseForm)
    return all
      .filter(w => w.baseForm.toLowerCase().includes(q) || w.id.includes(q))
      .slice(0, 8)
  }, [wordQuery])

  function pickWord(word) {
    clearSelection()
    setSelectedWord(word)
    setWordQuery('')
  }

  function pickAtom(atomId) {
    clearSelection()
    setSelectedAtom(atomId)
  }
  function pickPattern(patternId) {
    clearSelection()
    setSelectedPattern(patternId)
  }
  function pickCoupling(couplingId) {
    clearSelection()
    setSelectedCoupling(couplingId)
  }
  function pickComposite(compositeId) {
    clearSelection()
    setSelectedComposite(compositeId)
  }

  function isLit(setName, id) {
    if (!anySelection) return false  // dim by default; nothing lit
    return lit[setName].has(id)
  }
  // When nothing is selected, render everything at slightly higher opacity so
  // the canvas reads as "alive but idle" instead of dead.
  function shouldShowFull(setName, id) {
    return anySelection ? isLit(setName, id) : false
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={{
      background: F.bg, color: F.text,
      borderRadius: 8, padding: 24, marginTop: 8,
      minHeight: 700,
    }}>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 18, fontSize: 11, color: F.textDim }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: F.closedAtom }}></span>
          <span>closed-class atom <span style={{ color: F.label }}>(small fixed inventory)</span></span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: F.openAtom }}></span>
          <span>open-class atom <span style={{ color: F.label }}>(grows with vocabulary)</span></span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: F.allowed }}></span>
          <span>allowed pattern</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: F.forbidden }}></span>
          <span>forbidden pattern</span>
        </span>
      </div>

      {/* ── Entry points: word picker + sentence input ──────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <input
              type="text"
              placeholder="Explore from a word…"
              value={selectedWord ? selectedWord.baseForm : wordQuery}
              onChange={e => { setSelectedWord(null); setWordQuery(e.target.value) }}
              style={{
                width: '100%', padding: '8px 12px', boxSizing: 'border-box',
                background: F.bgPanel, border: `1px solid ${F.border}`, borderRadius: 6,
                color: F.text, fontSize: 13, fontFamily: 'inherit',
              }}
            />
            {wordMatches.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: F.bgPanel, border: `1px solid ${F.border}`, borderRadius: 6,
                maxHeight: 240, overflowY: 'auto', zIndex: 10,
              }}>
                {wordMatches.map(w => (
                  <button key={w.id} onClick={() => pickWord(w)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '6px 12px', background: 'transparent', border: 'none',
                      color: F.text, fontSize: 13, cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = F.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{w.baseForm}</span>
                    <span style={{ color: F.textDim, marginLeft: 8 }}>{w.grammaticalAtom ?? w.grammaticalCategory ?? '—'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {anySelection && (
            <button onClick={clearSelection}
              style={{
                padding: '6px 12px', background: F.bgPanel, border: `1px solid ${F.border}`,
                borderRadius: 6, color: F.textDim, fontSize: 12, cursor: 'pointer',
              }}>
              clear
            </button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: F.textDim, cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={showActiveAtoms} onChange={e => setShowActiveAtoms(e.target.checked)} />
              show active atoms
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: F.textDim, cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={groupByCoupling} onChange={e => setGroupByCoupling(e.target.checked)} />
              group patterns by coupling
            </label>
          </div>
        </div>

        {/* Sentence input — type a sentence and see its signature flow up */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="text"
            placeholder="…or type a sentence to see its signature"
            value={sentence}
            onChange={e => {
              setSelectedAtom(null); setSelectedPattern(null)
              setSelectedCoupling(null); setSelectedComposite(null)
              setSelectedWord(null); setWordQuery('')
              setSentence(e.target.value)
            }}
            style={{
              flex: 1, padding: '8px 12px', boxSizing: 'border-box',
              background: F.bgPanel, border: `1px solid ${F.border}`, borderRadius: 6,
              color: F.text, fontSize: 13, fontFamily: 'inherit',
            }}
          />
          {sentenceSignature && (
            <div style={{ fontSize: 11, color: F.textDim, whiteSpace: 'nowrap' }}>
              <span style={{ color: sentenceSignature.allowed ? F.allowed : F.forbidden, fontWeight: 600 }}>
                {sentenceSignature.allowed ? '✓ allowed' : '✗ rejected'}
              </span>
              <span style={{ marginLeft: 10 }}>
                {sentenceSignature.fired.length} pattern{sentenceSignature.fired.length === 1 ? '' : 's'} ·
                {' '}{lit.couplingSet.size} micro-structure{lit.couplingSet.size === 1 ? '' : 's'} ·
                {' '}{lit.compositeSet.size} composite{lit.compositeSet.size === 1 ? '' : 's'}
              </span>
              {sentenceSignature.unknownTokens.length > 0 && (
                <span style={{ marginLeft: 10, color: F.forbidden, fontWeight: 600 }}>
                  ⚠ unknown: {sentenceSignature.unknownTokens.join(', ')}
                </span>
              )}
              {sentenceSignature.atomlessTokens.length > 0 && (
                <span style={{ marginLeft: 10, color: F.forbidden, fontWeight: 600 }} title="known surface form, but no grammar info — needs L2 enrichment">
                  ⚠ no grammar info: {sentenceSignature.atomlessTokens.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Why rejected — always explain, with whatever info we have ─── */}
        {sentenceSignature && !sentenceSignature.allowed && (
          <RejectionPanel signature={sentenceSignature} onPickPattern={pickPattern} />
        )}
      </div>

      {/* ── Four columns ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 24, overflowX: 'auto',
        paddingBottom: 16,  // space for scrollbar
      }}>

        {/* Column 1 — Atoms */}
        <div style={{ minWidth: 240, padding: '0 8px' }}>
          <ColumnHeader level={1} title="Atoms" subtitle="Single grammatical types — the bricks." count={atoms.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sortedAtoms.map(a => {
              const litThis = shouldShowFull('atomSet', a.id)
              const isActive = showActiveAtoms && activeAtomSet.has(a.id)
              const color   = isOpenClass(a.id) ? F.openAtom : F.closedAtom
              return (
                <Cell key={a.id} lit={litThis || isActive} onClick={() => pickAtom(a.id)} title={a.description}>
                  <AtomShape color={color} lit={litThis || isActive || !anySelection} />
                  <CellLabel text={a.id} lit={litThis || isActive} color={color} mono />
                  {isActive && (
                    <div style={{ fontSize: 8, color: F.allowed, fontFamily: 'monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      ● active
                    </div>
                  )}
                </Cell>
              )
            })}
          </div>
        </div>

        {/* Column 2 — Micro-patterns (allowed only) */}
        <div style={{ minWidth: 280, padding: '0 8px' }}>
          <ColumnHeader level={2} title="Micro-patterns" subtitle="Atoms paired or grouped into specific shapes that license your sentence." count={sortedAllowedPatterns.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedAllowedPatterns.map(p => {
              const litThis  = shouldShowFull('patternSet', p.id)
              const atomNeed = p.license?.requiresAtoms ?? []
              const dotCount = Math.max(2, atomNeed.length)
              return (
                <Cell key={p.id} lit={litThis} onClick={() => pickPattern(p.id)} title={p.description}>
                  <MoleculeShape atomCount={dotCount} color={F.allowed} forbidden={false} lit={litThis || !anySelection} />
                  <CellLabel text={p.id} lit={litThis} color={F.allowed} mono />
                  {groupByCoupling && (
                    <div style={{ fontSize: 8, color: F.coupling, fontFamily: 'monospace' }}>
                      {p.coupling}
                    </div>
                  )}
                </Cell>
              )
            })}
          </div>
        </div>

        {/* Column 3 — Micro-structures (couplings) */}
        <div style={{ minWidth: 240, padding: '0 8px' }}>
          <ColumnHeader level={3} title="Micro-structures" subtitle="Structural concepts that one or more patterns implement." count={COUPLINGS.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedCouplings.map(c => {
              const litThis = shouldShowFull('couplingSet', c.id)
              const count   = patternsForCoupling(c.id).length
              return (
                <Cell key={c.id} lit={litThis} onClick={() => pickCoupling(c.id)} title={c.description}>
                  <HexagonShape color={F.coupling} lit={litThis || !anySelection} />
                  <CellLabel text={c.label} lit={litThis} color={F.coupling} />
                  <div style={{ fontSize: 9, color: F.textDim, fontFamily: 'monospace' }}>
                    {count} pattern{count === 1 ? '' : 's'}
                  </div>
                  {count === 0 && <WarnBadge>0 patterns</WarnBadge>}
                </Cell>
              )
            })}
          </div>
        </div>

        {/* Column 4 — Composites */}
        <div style={{ minWidth: 240, padding: '0 8px' }}>
          <ColumnHeader level={4} title="Composites" subtitle="Bigger structural shapes built from multiple micro-structures." count={COMPOSITES.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedComposites.map(c => {
              const litThis = shouldShowFull('compositeSet', c.id)
              const emptyCouplings = c.couplings.filter(cid => patternsForCoupling(cid).length === 0)
              return (
                <Cell key={c.id} lit={litThis} onClick={() => pickComposite(c.id)} title={c.description}>
                  <CompositeShape color={F.composite} lit={litThis || !anySelection} count={c.couplings.length} />
                  <CellLabel text={c.label} lit={litThis} color={F.composite} />
                  <div style={{ fontSize: 9, color: F.textDim, fontFamily: 'monospace', textAlign: 'center', maxWidth: 110, lineHeight: 1.3 }}>
                    {c.couplings.join(' · ')}
                  </div>
                  {emptyCouplings.length > 0 && (
                    <WarnBadge>
                      {emptyCouplings.length}/{c.couplings.length} empty
                    </WarnBadge>
                  )}
                </Cell>
              )
            })}
          </div>
        </div>

      </div>

      {/* ── Guards — separate from the flow circuit ───────────────────────
            Forbidden patterns are tripwires, not building blocks. They cross
            the flow with "STOP." Different conceptual thing, separate section.
      */}
      <div style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${F.border}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: F.forbidden, textTransform: 'uppercase' }}>
            Guards
          </div>
          <div style={{ fontSize: 11, color: F.textDim }}>
            Tripwires that flag broken English. Don't build sentences — reject them. When one lights up, your sentence matched a known mistake.
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 10, color: F.textDim, fontFamily: 'monospace' }}>
            {sortedForbiddenPatterns.length} guard{sortedForbiddenPatterns.length === 1 ? '' : 's'}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {sortedForbiddenPatterns.map(p => {
            const litThis = shouldShowFull('patternSet', p.id)
            const example = extractFirstExample(p.description)
            const opacity = anySelection ? (litThis ? 1 : 0.28) : 0.5
            return (
              <button
                key={p.id}
                onClick={() => pickPattern(p.id)}
                title={p.description}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 3,
                  padding: '6px 10px', minWidth: 160, maxWidth: 220,
                  background: litThis ? 'rgba(232, 95, 122, 0.10)' : 'transparent',
                  border: `1px solid ${F.forbidden}`,
                  borderRadius: 4,
                  color: F.forbidden,
                  fontFamily: 'monospace', fontSize: 11,
                  cursor: 'pointer', textAlign: 'left',
                  opacity, transition: 'opacity 200ms, background 200ms',
                }}>
                <span style={{ fontWeight: 700 }}>✗ {p.id}</span>
                {example && (
                  <span style={{ fontSize: 10, color: F.forbidden, fontStyle: 'italic' }}>
                    "{example}"
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Selection detail panel ──────────────────────────────────── */}
      {anySelection && (
        <div style={{
          marginTop: 24, padding: '14px 18px',
          background: F.bgPanel, border: `1px solid ${F.border}`, borderRadius: 6,
          fontSize: 12, color: F.text, lineHeight: 1.6,
        }}>
          {selectedWord && (() => {
            const wordAtoms = [...atomsForWord(selectedWord)]
            return <>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: F.label, textTransform: 'uppercase', marginBottom: 6 }}>Word</div>
              <div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: F.openAtom }}>{selectedWord.baseForm}</span>
                {wordAtoms.length === 0
                  ? <span style={{ color: F.forbidden, marginLeft: 8 }}>— this word has no atoms (needs L1/L2 enrichment)</span>
                  : <> — atoms: {wordAtoms.map((aid, i) => (
                      <span key={aid}>{i > 0 && ', '}
                        <ClickableId color={isOpenClass(aid) ? F.openAtom : F.closedAtom} onClick={() => pickAtom(aid)}>{aid}</ClickableId>
                      </span>
                    ))}
                  </>
                }
              </div>
              {selectedWord.meaning && <div style={{ color: F.textDim, marginTop: 4 }}>{selectedWord.meaning}</div>}
            </>
          })()}
          {selectedAtom && (() => {
            const a = atoms.find(x => x.id === selectedAtom)
            if (!a) return null
            const d = a.defaults
            return <>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: F.label, textTransform: 'uppercase', marginBottom: 6 }}>Atom</div>
              <div><span style={{ fontFamily: 'monospace', fontWeight: 700, color: isOpenClass(a.id) ? F.openAtom : F.closedAtom }}>{a.id}</span> — {a.label}</div>
              <div style={{ color: F.textDim, marginTop: 4 }}>{a.description}</div>
              {d && (
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${F.border}` }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', color: F.label, textTransform: 'uppercase', marginBottom: 4 }}>
                    Design defaults
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 12px', fontFamily: 'monospace', fontSize: 11 }}>
                    <span style={{ color: F.label }}>category</span>
                    <span style={{ color: F.text }}>{d.category ?? <span style={{ color: F.textDim, fontStyle: 'italic' }}>—</span>}</span>
                    <span style={{ color: F.label }}>pioneer</span>
                    <span style={{ color: d.pioneer == null ? F.textDim : F.text, fontStyle: d.pioneer == null ? 'italic' : 'normal' }}>
                      {d.pioneer ?? 'null (umbrella / alt-only / structure-only)'}
                    </span>
                    <span style={{ color: F.label }}>groups</span>
                    <span style={{ color: F.text }}>
                      {(d.groups ?? []).length === 0
                        ? <span style={{ color: F.textDim, fontStyle: 'italic' }}>(none)</span>
                        : d.groups.join(', ')}
                    </span>
                    <span style={{ color: F.label }}>promptLabel</span>
                    <span style={{ color: d.promptLabel == null ? F.textDim : F.text, fontStyle: d.promptLabel == null ? 'italic' : 'normal' }}>
                      {d.promptLabel ?? '(omitted)'}
                    </span>
                  </div>
                </div>
              )}
            </>
          })()}
          {selectedPattern && (() => {
            const p = PATTERNS.find(x => x.id === selectedPattern)
            if (!p) return null
            const patternAtoms = [...atomsForPattern(p)]
            // Fired matches for this pattern in the current sentence (if any).
            // Surfaces per-match info (data-driven slot rules attach context
            // here — adverbType, verbAtom, formType, etc.) and per-match
            // license overrides (so users can see when a slot rule emits a
            // license different from the pattern's static one).
            const firedForPattern = sentenceSignature?.fired?.filter(f => f.patternId === p.id) ?? []
            function spanText(span) {
              const tokens = sentenceSignature?.tokens
              if (!span || !tokens) return ''
              const [a, b] = span
              const out = []
              for (let i = a; i <= b && i < tokens.length; i++) out.push(tokens[i].surface)
              return out.join(' ')
            }
            function licenseSummary(lic) {
              if (!lic) return '(none)'
              if (lic.alwaysForbidden) return 'alwaysForbidden'
              if (lic.requiresAtoms?.length) return `requires [${lic.requiresAtoms.join(', ')}]`
              return '(empty)'
            }
            const patternLicSummary = licenseSummary(p.license)
            return <>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: F.label, textTransform: 'uppercase', marginBottom: 6 }}>Pattern</div>
              <div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: p.license?.alwaysForbidden ? F.forbidden : F.allowed }}>{p.id}</span>
                {' — '}{p.type} · coupling: <ClickableId color={F.coupling} onClick={() => pickCoupling(p.coupling)}>{p.coupling}</ClickableId>
              </div>
              {patternAtoms.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  atoms: {patternAtoms.map((aid, i) => (
                    <span key={aid}>{i > 0 && ', '}
                      <ClickableId color={isOpenClass(aid) ? F.openAtom : F.closedAtom} onClick={() => pickAtom(aid)}>{aid}</ClickableId>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 11, color: F.textDim }}>
                pattern license: <span style={{ color: F.text }}>{patternLicSummary}</span>
              </div>
              <div style={{ color: F.textDim, marginTop: 4 }}>{p.description}</div>

              {firedForPattern.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${F.border}` }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', color: F.label, textTransform: 'uppercase', marginBottom: 4 }}>
                    Fired in this sentence ({firedForPattern.length})
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {firedForPattern.map((f, i) => {
                      const surface = spanText(f.span)
                      const matchLicSummary = licenseSummary(f.license)
                      const licenseDiffers = f.licenseFromMatch && matchLicSummary !== patternLicSummary
                      const allowed = f.verdict?.allowed
                      return (
                        <li key={i} style={{ paddingLeft: 6, borderLeft: `2px solid ${allowed ? F.allowed : F.forbidden}`, paddingTop: 2, paddingBottom: 2 }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
                            <span style={{ color: allowed ? F.allowed : F.forbidden, fontWeight: 600 }}>
                              {allowed ? '✓' : '✗'}
                            </span>
                            {' '}
                            <span style={{ color: F.text }}>"{surface}"</span>
                            {' '}
                            <span style={{ color: F.textDim }}>span [{f.span[0]}–{f.span[1]}]</span>
                          </div>
                          {f.info && Object.keys(f.info).length > 0 && (
                            <div style={{ fontFamily: 'monospace', fontSize: 10, color: F.textDim, marginTop: 2 }}>
                              info: {Object.entries(f.info).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' · ')}
                            </div>
                          )}
                          {licenseDiffers && (
                            <div style={{ fontFamily: 'monospace', fontSize: 10, color: F.coupling, marginTop: 2 }}>
                              ↳ per-match license: {matchLicSummary}
                            </div>
                          )}
                          {!allowed && f.verdict?.reason && (
                            <div style={{ fontSize: 10, color: F.forbidden, marginTop: 2, fontStyle: 'italic' }}>
                              {f.verdict.reason}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </>
          })()}
          {selectedCoupling && (() => {
            const c = COUPLINGS.find(x => x.id === selectedCoupling)
            if (!c) return null
            const ps    = patternsForCoupling(c.id)
            const comps = compositesForCoupling(c.id)
            return <>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: F.label, textTransform: 'uppercase', marginBottom: 6 }}>Micro-structure</div>
              <div><span style={{ fontFamily: 'monospace', fontWeight: 700, color: F.coupling }}>{c.id}</span> — {c.label}</div>
              <div style={{ color: F.textDim, marginTop: 4 }}>{c.description}</div>
              {ps.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  patterns: {ps.map((p, i) => (
                    <span key={p.id}>{i > 0 && ', '}
                      <ClickableId color={p.license?.alwaysForbidden ? F.forbidden : F.allowed} onClick={() => pickPattern(p.id)}>{p.id}</ClickableId>
                    </span>
                  ))}
                </div>
              )}
              {comps.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  in composites: {comps.map((cm, i) => (
                    <span key={cm.id}>{i > 0 && ', '}
                      <ClickableId color={F.composite} onClick={() => pickComposite(cm.id)}>{cm.id}</ClickableId>
                    </span>
                  ))}
                </div>
              )}
            </>
          })()}
          {selectedComposite && (() => {
            const c = COMPOSITES.find(x => x.id === selectedComposite)
            if (!c) return null
            return <>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: F.label, textTransform: 'uppercase', marginBottom: 6 }}>Composite</div>
              <div><span style={{ fontFamily: 'monospace', fontWeight: 700, color: F.composite }}>{c.id}</span> — {c.label}</div>
              <div style={{ color: F.textDim, marginTop: 4 }}>{c.description}</div>
              <div style={{ marginTop: 6 }}>
                built from: {c.couplings.map((cid, i) => (
                  <span key={cid}>{i > 0 && ' + '}
                    <ClickableId color={F.coupling} onClick={() => pickCoupling(cid)}>{cid}</ClickableId>
                  </span>
                ))}
              </div>
            </>
          })()}
        </div>
      )}

      {!anySelection && (
        <div style={{ marginTop: 24, fontSize: 12, color: F.textDim, textAlign: 'center', fontStyle: 'italic' }}>
          pick a word, an atom, a pattern, a micro-structure, or a composite to light up its connections
        </div>
      )}
    </div>
  )
}
