import { useState } from 'react'
import { useInventory } from './InventoryContext'
import { checkCircuitFull } from './circuitCheck'
import { FIXED_UNITS, TEST_MODAL_TRIGGERS } from './multiWordUnits.en.js'

const T = {
  page: '#ffffff', card: '#e8e8ea', border: '#c4c4c6',
  text: '#1a1a1a', textDim: '#777', textSub: '#444', label: '#666',
  green: '#1a5a1a', greenBg: '#d8eed8', greenBord: '#90c090',
  red: '#7a1a1a', redBg: '#f0d8d8', redBord: '#d09090',
  layerTag: '#1a5a1a',
}

const TYPE_STYLE = {
  fixed_unit:   { bg: '#e8d8f4', border: '#b890d8', color: '#4a1a8a', label: 'unit' },
  construction: { bg: '#fde8c8', border: '#d8a050', color: '#7a4000', label: 'construction' },
  banked:       { bg: T.greenBg, border: T.greenBord, color: T.green, label: 'banked' },
  function:     { bg: T.card,    border: T.border,    color: T.textDim, label: 'fn' },
  unknown:      { bg: T.redBg,   border: T.redBord,   color: T.red,    label: '?' },
  punctuation:  { bg: 'transparent', border: 'transparent', color: T.textDim, label: '' },
}

export default function CircuitTest({ onClose }) {
  const { inventory } = useInventory()
  const { wordBank, grammarPosition } = inventory
  const { atomWords } = grammarPosition

  const [input, setInput]         = useState('')
  const [tokens, setTokens]       = useState(null)
  const [showRegistry, setShowRegistry] = useState(false)
  const [modalMode, setModalMode] = useState('registry') // 'registry' | 'test'

  function run() {
    const effectiveAtomWords = modalMode === 'test'
      ? { ...atomWords, modal_auxiliary: TEST_MODAL_TRIGGERS }
      : atomWords
    setTokens(checkCircuitFull(input, wordBank, effectiveAtomWords))
  }

  const counts = tokens ? tokens.reduce((acc, t) => {
    if (t.type !== 'punctuation') acc[t.type] = (acc[t.type] ?? 0) + 1
    return acc
  }, {}) : null

  const [copied, setCopied] = useState(false)
  function copy() {
    const lines = [
      `INPUT: ${input}`,
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={onClose}
          style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textSub, cursor: 'pointer', fontSize: 13, padding: '5px 12px' }}>
          ← close
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Circuit Test</h2>
      </div>

      <div style={{ marginBottom: 16, padding: '12px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, color: T.textSub, lineHeight: 1.7 }}>
        <strong>Legend:</strong>{' '}
        <span style={{ color: '#4a1a8a' }}>■ fixed unit</span> &nbsp;
        <span style={{ color: '#7a4000' }}>■ construction</span> &nbsp;
        <span style={{ color: T.green }}>■ banked</span> &nbsp;
        <span style={{ color: T.textDim }}>■ function word</span> &nbsp;
        <span style={{ color: T.red }}>■ unknown</span>
      </div>

      {/* Registry panel */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setShowRegistry(p => !p)}
          style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textSub, cursor: 'pointer', fontSize: 12, padding: '4px 12px' }}>
          {showRegistry ? 'hide registry' : 'show registry'}
        </button>
        {showRegistry && (
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Fixed units */}
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
            {/* Modal triggers — derived from banked modal_auxiliary words */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#7a4000', textTransform: 'uppercase', marginBottom: 10 }}>
                Modal Triggers — from word bank ({(atomWords['modal_auxiliary'] ?? []).length})
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

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.trim()) run() } }}
        placeholder="Type a sentence and press Enter or Run…"
        style={{ width: '100%', minHeight: 80, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text, fontSize: 15, padding: '10px 12px', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, background: T.card, marginBottom: 10 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={run} disabled={!input.trim()}
          style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textSub, cursor: input.trim() ? 'pointer' : 'default', fontSize: 13, padding: '6px 18px', opacity: input.trim() ? 1 : 0.4 }}>
          run
        </button>
        <div style={{ display: 'flex', gap: 0 }}>
          <button onClick={() => setModalMode('registry')}
            style={{ fontSize: 11, padding: '4px 10px', border: `1px solid ${T.border}`, borderRight: 'none', borderRadius: '4px 0 0 4px', cursor: 'pointer', background: modalMode === 'registry' ? '#fde8c8' : '#fff', color: modalMode === 'registry' ? '#7a4000' : T.textDim, fontWeight: modalMode === 'registry' ? 700 : 400 }}>
            registry
          </button>
          <button onClick={() => setModalMode('test')}
            style={{ fontSize: 11, padding: '4px 10px', border: `1px solid ${T.border}`, borderRadius: '0 4px 4px 0', cursor: 'pointer', background: modalMode === 'test' ? '#fde8c8' : '#fff', color: modalMode === 'test' ? '#7a4000' : T.textDim, fontWeight: modalMode === 'test' ? 700 : 400 }}>
            test set
          </button>
        </div>
        <span style={{ fontSize: 11, color: T.textDim }}>
          {modalMode === 'test' ? 'hardcoded modals' : 'banked modals only'}
        </span>
      </div>

      {tokens && (
        <div style={{ marginTop: 20 }}>
          {/* Token chips — split into sentences on period */}
          {tokens.reduce((sentences, t) => {
            if (sentences.length === 0) sentences.push([])
            sentences[sentences.length - 1].push(t)
            if (t.type === 'punctuation' && t.surface === '.') sentences.push([])
            return sentences
          }, []).filter(s => s.length > 0).map((sentence, si) => (
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
          ))}

          {/* Counts + copy */}
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
        </div>
      )}
    </div>
  )
}
