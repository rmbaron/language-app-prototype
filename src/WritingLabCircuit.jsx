import { T, Label } from './writingLabTheme'
import { checkCircuit, circuitSummary, splitSentences } from './circuitCheck'

const CIRCUIT_STYLE = {
  fixed_unit:   { bg: '#e8d8f4', border: '#b890d8', color: '#4a1a8a', label: 'unit'         },
  construction: { bg: '#fde8c8', border: '#d8a050', color: '#7a4000', label: 'construction' },
  banked:       { bg: T.greenBg,  border: T.greenBord,  color: T.green,   label: 'banked'  },
  function:     { bg: T.card,     border: T.border,      color: T.textDim, label: 'fn'      },
  unknown:      { bg: T.redBg,    border: T.redBord,     color: T.red,     label: '?'       },
  punctuation:  { bg: 'transparent', border: 'transparent', color: T.textDim, label: ''    },
}

export function CircuitDisplay({ tokens }) {
  const nonPunct = tokens.filter(t => t.type !== 'punctuation')
  const unknown  = nonPunct.filter(t => t.type === 'unknown')
  const passed   = nonPunct.length - unknown.length
  const clean    = unknown.length === 0

  return (
    <div style={{ marginTop: 12, padding: '12px 14px', background: T.codeBg, border: `1px solid ${T.border}`, borderRadius: 5 }}>
      <Label>Circuit Check</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
        {tokens.map((t, i) => {
          const s = CIRCUIT_STYLE[t.type] ?? CIRCUIT_STYLE.unknown
          if (t.type === 'punctuation') return (
            <span key={i} style={{ color: T.textDim, fontSize: 18, paddingBottom: 18 }}>{t.surface}</span>
          )
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ padding: '6px 12px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 5, color: s.color, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {t.surface}
              </div>
              <span style={{ fontSize: 9, color: s.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t.atomClass ?? s.label}</span>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 12, color: clean ? T.green : T.red, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
        {passed}/{nonPunct.length} passed
        {unknown.length > 0 && <span style={{ color: T.red }}> · unknown: {unknown.map(t => t.surface).join(', ')}</span>}
      </div>
    </div>
  )
}

export function SentenceCircuitDisplay({ text, wordBank, wordTokens }) {
  const sentences = splitSentences(text)
  if (sentences.length === 0) return null

  const wordCircuitCount = wordTokens
    ? new Set(wordTokens.map(t => t.sentenceIndex ?? 1)).size
    : null
  const sentenceCount = sentences.length
  const aligned = wordCircuitCount === null || wordCircuitCount === sentenceCount

  return (
    <div style={{ marginTop: 8, padding: '10px 12px', background: T.codeBg, border: `1px solid ${T.border}`, borderRadius: 5 }}>
      <Label>Sentence Circuit</Label>
      {sentences.map(s => {
        const tokens  = checkCircuit(s.text, wordBank)
        const summary = circuitSummary(tokens)
        return (
          <div key={s.index} style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.textDim, flexShrink: 0, width: 18 }}>S{s.index}</span>
            <span style={{ fontSize: 13, color: summary.clean ? T.green : T.red, flex: 1, lineHeight: 1.5 }}>
              {s.text}{s.terminator ?? ''}
            </span>
            <span style={{ fontSize: 11, color: T.textDim, flexShrink: 0, whiteSpace: 'nowrap' }}>
              {summary.passed}/{summary.total}
              {!summary.clean && ` · ${summary.unknownWords.join(', ')}`}
            </span>
          </div>
        )
      })}
      <div style={{ fontSize: 11, color: aligned ? T.green : T.red, borderTop: `1px solid ${T.border}`, paddingTop: 6, marginTop: 4 }}>
        {aligned
          ? `✓ both circuits agree: ${sentenceCount} sentence${sentenceCount !== 1 ? 's' : ''}`
          : `✗ mismatch — sentence circuit: ${sentenceCount}, word circuit: ${wordCircuitCount}`}
      </div>
    </div>
  )
}
