import { useState } from 'react'
import { useInventory } from './InventoryContext'
import { checkCircuitFull, splitSentences } from './circuitCheck'
import { FIXED_UNITS, TEST_MODAL_TRIGGERS, TEST_PROGRESSIVE_TRIGGERS } from './multiWordUnits.en.js'

const T = {
  page: '#ffffff', card: '#e8e8ea', border: '#c4c4c6',
  text: '#1a1a1a', textDim: '#777', textSub: '#444', label: '#666',
  green: '#1a5a1a', greenBg: '#d8eed8', greenBord: '#90c090',
  red: '#7a1a1a', redBg: '#f0d8d8', redBord: '#d09090',
}

const TYPE_STYLE = {
  fixed_unit:   { bg: '#e8d8f4', border: '#b890d8', color: '#4a1a8a', label: 'unit' },
  construction: { bg: '#fde8c8', border: '#d8a050', color: '#7a4000', label: 'construction' },
  banked:       { bg: T.greenBg, border: T.greenBord, color: T.green, label: 'banked' },
  function:     { bg: T.card,    border: T.border,    color: T.textDim, label: 'fn' },
  unknown:      { bg: T.redBg,   border: T.redBord,   color: T.red,    label: '?' },
  punctuation:  { bg: 'transparent', border: 'transparent', color: T.textDim, label: '' },
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: T.label, textTransform: 'uppercase', marginBottom: 12 }}>
      {children}
    </div>
  )
}

export default function CircuitTest({ onClose }) {
  const { inventory } = useInventory()
  const { wordBank, grammarPosition } = inventory
  const { atomWords } = grammarPosition

  const [input, setInput]         = useState('')
  const [tokens, setTokens]       = useState(null)
  const [sentences, setSentences] = useState(null)
  const [showRegistry, setShowRegistry] = useState(false)
  const [modalMode, setModalMode]           = useState('registry')
  const [progressiveMode, setProgressiveMode] = useState('registry')

  function runOn(text, mMode = modalMode, pMode = progressiveMode) {
    if (!text.trim()) { setTokens(null); setSentences(null); return }
    const effectiveAtomWords = {
      ...atomWords,
      ...(mMode === 'test' ? { modal_auxiliary: TEST_MODAL_TRIGGERS } : {}),
      ...(pMode === 'test' ? { copula: TEST_PROGRESSIVE_TRIGGERS }    : {}),
    }
    setTokens(checkCircuitFull(text, wordBank, effectiveAtomWords))
    setSentences(splitSentences(text))
  }

  function clear() { setInput(''); setTokens(null); setSentences(null) }

  const clearBtn = (
    <button onClick={clear}
      style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textDim, cursor: 'pointer', fontSize: 11, padding: '4px 10px' }}>
      clear
    </button>
  )

  const counts = tokens ? tokens.reduce((acc, t) => {
    if (t.type !== 'punctuation') acc[t.type] = (acc[t.type] ?? 0) + 1
    return acc
  }, {}) : null

  const [copied, setCopied] = useState(false)
  function copy() {
    const lines = [
      `INPUT: ${input}`,
      ``,
      `SENTENCES:`,
      ...sentences.map(s => `  ${s.index}. ${s.text}${s.terminator ?? ''}`),
      ``,
      `TOKENS:`,
      ...tokens.filter(t => t.type !== 'punctuation').map(t =>
        `  ${t.surface.padEnd(20)} ${t.type}${t.atomClass ? ` · ${t.atomClass}` : ''}`
      ),
      ``,
      `COUNTS: ` + Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(' · '),
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', background: T.page, minHeight: '100vh', color: T.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={onClose}
          style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textSub, cursor: 'pointer', fontSize: 13, padding: '5px 12px' }}>
          ← close
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Circuit Test</h2>
      </div>

      {/* Shared input */}
      <textarea
        value={input}
        onChange={e => { setInput(e.target.value); runOn(e.target.value) }}
        placeholder="Type to run the circuit live…"
        style={{ width: '100%', minHeight: 80, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text, fontSize: 15, padding: '10px 12px', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, background: T.card, marginBottom: 10 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        {clearBtn}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: T.textDim }}>modals:</span>
            <div style={{ display: 'flex', gap: 0 }}>
              <button onClick={() => { setModalMode('registry'); runOn(input, 'registry', progressiveMode) }}
                style={{ fontSize: 11, padding: '4px 10px', border: `1px solid ${T.border}`, borderRight: 'none', borderRadius: '4px 0 0 4px', cursor: 'pointer', background: modalMode === 'registry' ? '#fde8c8' : '#fff', color: modalMode === 'registry' ? '#7a4000' : T.textDim, fontWeight: modalMode === 'registry' ? 700 : 400 }}>
                registry
              </button>
              <button onClick={() => { setModalMode('test'); runOn(input, 'test', progressiveMode) }}
                style={{ fontSize: 11, padding: '4px 10px', border: `1px solid ${T.border}`, borderRadius: '0 4px 4px 0', cursor: 'pointer', background: modalMode === 'test' ? '#fde8c8' : '#fff', color: modalMode === 'test' ? '#7a4000' : T.textDim, fontWeight: modalMode === 'test' ? 700 : 400 }}>
                test set
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: T.textDim }}>progressive:</span>
            <div style={{ display: 'flex', gap: 0 }}>
              <button onClick={() => { setProgressiveMode('registry'); runOn(input, modalMode, 'registry') }}
                style={{ fontSize: 11, padding: '4px 10px', border: `1px solid ${T.border}`, borderRight: 'none', borderRadius: '4px 0 0 4px', cursor: 'pointer', background: progressiveMode === 'registry' ? '#d8eef8' : '#fff', color: progressiveMode === 'registry' ? '#004a7a' : T.textDim, fontWeight: progressiveMode === 'registry' ? 700 : 400 }}>
                registry
              </button>
              <button onClick={() => { setProgressiveMode('test'); runOn(input, modalMode, 'test') }}
                style={{ fontSize: 11, padding: '4px 10px', border: `1px solid ${T.border}`, borderRadius: '0 4px 4px 0', cursor: 'pointer', background: progressiveMode === 'test' ? '#d8eef8' : '#fff', color: progressiveMode === 'test' ? '#004a7a' : T.textDim, fontWeight: progressiveMode === 'test' ? 700 : 400 }}>
                test set
              </button>
            </div>
          </div>
        </div>
      </div>

      <>
          {/* ── Sentence circuit ── */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Sentence Circuit{sentences ? ` — ${sentences.length} sentence${sentences.length !== 1 ? 's' : ''}` : ''}</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(sentences ?? []).map(s => (
                <div key={s.index} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '10px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 5 }}>
                  <span style={{ fontSize: 11, color: T.textDim, minWidth: 20 }}>{s.index}</span>
                  <span style={{ fontSize: 14, color: T.text, flex: 1 }}>{s.text}</span>
                  <span style={{ fontSize: 16, color: T.textDim, fontWeight: 700 }}>{s.terminator ?? <span style={{ fontStyle: 'italic', fontSize: 11 }}>no terminator</span>}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Word circuit ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: T.label, textTransform: 'uppercase' }}>Word Circuit</div>
              {clearBtn}
            </div>

            {/* Legend */}
            <div style={{ marginBottom: 12, padding: '10px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, color: T.textSub, lineHeight: 1.7 }}>
              <span style={{ color: '#4a1a8a' }}>■ fixed unit</span> &nbsp;
              <span style={{ color: '#7a4000' }}>■ construction</span> &nbsp;
              <span style={{ color: T.green }}>■ banked</span> &nbsp;
              <span style={{ color: T.textDim }}>■ function word</span> &nbsp;
              <span style={{ color: T.red }}>■ unknown</span>
            </div>

            {/* Registry toggle */}
            <div style={{ marginBottom: 14 }}>
              <button onClick={() => setShowRegistry(p => !p)}
                style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textSub, cursor: 'pointer', fontSize: 12, padding: '4px 12px' }}>
                {showRegistry ? 'hide registry' : 'show registry'}
              </button>
              {showRegistry && (
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#4a1a8a', textTransform: 'uppercase', marginBottom: 10 }}>
                      Fixed Units ({FIXED_UNITS.length})
                    </div>
                    {FIXED_UNITS.map(u => (
                      <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                        <span style={{ color: '#4a1a8a', fontWeight: 600 }}>{u.text}</span>
                        <span style={{ color: T.textDim }}>{u.atomClass}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#7a4000', textTransform: 'uppercase', marginBottom: 10 }}>
                      Modal Triggers ({(atomWords['modal_auxiliary'] ?? []).length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(atomWords['modal_auxiliary'] ?? []).map(w => (
                        <span key={w} style={{ padding: '3px 8px', background: '#fde8c8', border: '1px solid #d8a050', borderRadius: 4, fontSize: 12, color: '#7a4000', fontWeight: 600 }}>{w}</span>
                      ))}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: T.textDim }}>
                      Derived from modal_auxiliary atom. Grows automatically as modals are banked.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Token chips — grouped by sentenceIndex */}
            {tokens && (() => {
              const groups = {}
              tokens.forEach(t => { const si = t.sentenceIndex ?? 1; if (!groups[si]) groups[si] = []; groups[si].push(t) })
              return Object.values(groups).map((sentence, si) => (
                <div key={si} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
                  {sentence.map((t, i) => {
                    const s = TYPE_STYLE[t.type] ?? TYPE_STYLE.unknown
                    if (t.type === 'punctuation') return (
                      <span key={i} style={{ color: T.textDim, fontSize: 18, paddingBottom: 18 }}>{t.surface}</span>
                    )
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div style={{ padding: '6px 12px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 5, color: s.color, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {t.surface}
                        </div>
                        <span style={{ fontSize: 9, color: s.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          {t.atomClass ?? s.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))
            })()}

            {/* Counts + copy */}
            {tokens && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: T.textSub, flex: 1 }}>
                  {Object.entries(counts).map(([type, n]) => (
                    <span key={type}>
                      <span style={{ color: TYPE_STYLE[type]?.color ?? T.text, fontWeight: 700 }}>{n}</span> {type}
                    </span>
                  ))}
                </div>
                <button onClick={copy}
                  style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textSub, cursor: 'pointer', fontSize: 11, padding: '3px 10px', flexShrink: 0 }}>
                  {copied ? 'copied ✓' : 'copy'}
                </button>
              </div>
            )}

            {/* Alignment check */}
            {tokens && sentences && (() => {
              const wordCount     = new Set(tokens.map(t => t.sentenceIndex ?? 1)).size
              const sentenceCount = sentences.length
              const aligned       = wordCount === sentenceCount
              return (
                <div style={{ marginTop: 10, fontSize: 11, color: aligned ? T.green : T.red }}>
                  {aligned
                    ? `✓ both circuits agree: ${sentenceCount} sentence${sentenceCount !== 1 ? 's' : ''}`
                    : `✗ mismatch — sentence circuit: ${sentenceCount}, word circuit: ${wordCount}`}
                </div>
              )
            })()}
            <div style={{ marginTop: 14 }}>{clearBtn}</div>
          </div>
      </>
    </div>
  )
}
