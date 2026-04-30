import { useState } from 'react'
import { getActiveLanguage } from './learnerProfile'
import { checkSystemCircuit, checkSystemCircuitBatch } from './systemCircuit'
import { putEntry } from './contentPool'

const C = {
  bg:            '#f5f6fb',
  card:          '#ffffff',
  border:        '#dde0f0',
  primary:       '#1a1a2e',
  secondary:     '#4a5080',
  muted:         '#8890b8',
  accent:        '#3355cc',
  accentBg:      '#eef1ff',
  accentBorder:  '#b0bef0',
  success:       '#1a7a35',
  successBg:     '#e8f5ed',
  successBorder: '#88c8a0',
  danger:        '#a0182a',
  dangerBg:      '#fdecea',
  dangerBorder:  '#f0a0a8',
  warning:       '#8a6000',
  warningBg:     '#fffbec',
  warningBorder: '#f0d080',
  matched:       '#1a7a35',
  matchedBg:     '#e8f5ed',
  unknownBg:     '#f0f0f4',
}

const CEFR_TO_CLUSTER = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }

function cefrToCluster(level) {
  return CEFR_TO_CLUSTER[level] ?? 1
}

function deriveClusterRange(matched) {
  const clusters = matched.map(m => cefrToCluster(m.cefrLevel)).filter(Boolean)
  if (clusters.length === 0) return { floor: 0, ceiling: 0 }
  return { floor: Math.min(...clusters), ceiling: Math.max(...clusters) }
}

function buildEntryFromSentence(sentence, result, sourceLabel, lang) {
  const { floor, ceiling } = deriveClusterRange(result.matched)
  const wordIds = [...new Set(result.matched.map(m => m.baseForm))]

  const wordAnnotations = {}
  for (const m of result.matched) {
    if (!wordAnnotations[m.baseForm]) {
      wordAnnotations[m.baseForm] = {
        targetForm: m.surface,
        wordSpan: m.span,
        targetIsBlankable: true,
      }
    }
  }

  return {
    text: sentence.text + (sentence.terminator ?? ''),
    lang,
    wordIds,
    wordAnnotations,
    clusterFloor: floor,
    clusterCeiling: ceiling,
    cefrLevel: result.matched.map(m => m.cefrLevel).find(Boolean) ?? null,
    themes: [],
    properties: {
      hasMultipleForms: false,
      structureIsLabeled: false,
      isDialogue: false,
      sentenceCount: sentence.sentenceCount ?? 1,
    },
    source: 'ingested',
    sourceContext: { lane: null, promptTheme: sourceLabel.trim() || null },
  }
}

// status: 'matched' | 'function' | 'unknown'
function Token({ token, status }) {
  const [tooltip, setTooltip] = useState(false)

  const styles = {
    matched:  { color: C.matched,   bg: C.matchedBg,  weight: 600 },
    function: { color: C.accent,    bg: C.accentBg,   weight: 400 },
    unknown:  { color: C.muted,     bg: C.unknownBg,  weight: 400 },
  }
  const s = styles[status] ?? styles.unknown

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onMouseEnter={() => status === 'matched' && setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        style={{
          display: 'inline-block', margin: '0 2px', padding: '2px 5px',
          borderRadius: 3, fontSize: 13, fontWeight: s.weight,
          color: s.color, background: s.bg, userSelect: 'none',
        }}
      >
        {token.surface}
      </span>

      {tooltip && status === 'matched' && (
        <div style={{
          position: 'fixed',
          background: C.primary, color: '#fff',
          fontSize: 12, borderRadius: 6, padding: '6px 12px',
          whiteSpace: 'nowrap', zIndex: 9999, pointerEvents: 'none',
          transform: 'translateY(-130%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {token.baseForm} · {token.atomId ?? '?'} · {token.cefrLevel ?? '?'}
        </div>
      )}
    </span>
  )
}

function SentenceResult({ sentence, result, selected, onToggle, expanded, onToggleExpand, entry }) {
  const total = result.matched.length + result.unknown.length  // excludes function words
  const ratio = total === 0 ? 0 : result.matched.length / total
  const coverageColor = ratio >= 0.7 ? C.success : ratio >= 0.4 ? C.warning : C.danger

  const tokens = [
    ...result.matched.map(m => ({ ...m, status: 'matched' })),
    ...(result.function ?? []).map(f => ({ ...f, status: 'function' })),
    ...result.unknown.map(u => ({ ...u, status: 'unknown' })),
  ].sort((a, b) => (a.span?.start ?? 0) - (b.span?.start ?? 0))

  return (
    <div style={{
      background: C.card, border: `1px solid ${selected ? C.accentBorder : C.border}`,
      borderRadius: 8, marginBottom: 8, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px' }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={e => onToggle(e.target.checked)}
          style={{ marginTop: 4, flexShrink: 0 }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, marginBottom: 6 }}>
            {tokens.map((t, i) => (
              <Token key={i} token={t} status={t.status} />
            ))}
          </div>

          <div style={{ fontSize: 11, color: coverageColor }}>
            {result.matched.length} / {total} words recognized
            {result.unknown.length > 0 && (
              <span style={{ color: C.muted, marginLeft: 8 }}>
                unknown: {result.unknown.map(u => u.surface).join(', ')}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onToggleExpand}
          style={{
            fontSize: 11, color: C.muted, background: 'none',
            border: 'none', cursor: 'pointer', padding: '2px 6px',
          }}
        >
          {expanded ? '▲ hide' : '▼ preview'}
        </button>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 12px', background: C.bg }}>
          <div style={{ fontSize: 11, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6 }}>
            What gets written to pool
          </div>
          <pre style={{ fontSize: 11, color: C.secondary, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(entry, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function IngestionTab() {
  const lang = getActiveLanguage() ?? 'en'

  const [text, setText] = useState('')
  const [sourceLabel, setSourceLabel] = useState('')
  const [results, setResults] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [expanded, setExpanded] = useState(new Set())
  const [status, setStatus] = useState(null)
  const [copied, setCopied] = useState(false)
  const [keepAsUnit, setKeepAsUnit] = useState(false)

  function analyze() {
    if (!text.trim()) return
    let batch
    if (keepAsUnit) {
      const result = checkSystemCircuit(text.trim(), lang)
      const sentenceCount = checkSystemCircuitBatch(text.trim(), lang).length
      batch = [{ index: 1, text: text.trim(), terminator: null, sentenceCount, ...result }]
    } else {
      batch = checkSystemCircuitBatch(text.trim(), lang)
    }
    setResults(batch)
    setSelected(new Set(batch.map((_, i) => i)))
    setExpanded(new Set())
    setStatus(null)
  }

  function clearResult() {
    setResults(null)
    setSelected(new Set())
    setExpanded(new Set())
    setStatus(null)
  }

  function toggleSelect(i, val) {
    setSelected(prev => {
      const next = new Set(prev)
      val ? next.add(i) : next.delete(i)
      return next
    })
  }

  function toggleExpand(i) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  async function addToPool() {
    if (!results) return
    let added = 0
    for (const i of selected) {
      const { sentence, result } = { sentence: results[i], result: results[i] }
      if (result.matched.length === 0) continue
      const entry = buildEntryFromSentence(result, result, sourceLabel, lang)
      await putEntry(entry)
      added++
    }
    setStatus(`${added} sentence${added !== 1 ? 's' : ''} added to pool as pending.`)
  }

  async function copyResults() {
    if (!results) return
    const text = JSON.stringify(results, null, 2)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function copyDbName() {
    await navigator.clipboard.writeText('lapp-content-pool')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const allUnknown = results
    ? [...new Set(results.flatMap(r => r.unknown.map(u => u.surface)))]
    : []

  return (
    <div>
      {/* DevTools hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: C.muted }}>
          To inspect pool: DevTools → Application → IndexedDB →
        </span>
        <button
          onClick={copyDbName}
          style={{
            fontSize: 11, color: C.accent, background: C.accentBg,
            border: `1px solid ${C.accentBorder}`, borderRadius: 4,
            padding: '2px 8px', cursor: 'pointer', fontWeight: 600,
          }}
        >
          copy db name
        </button>
        {copied && <span style={{ fontSize: 11, color: C.success }}>Copied!</span>}
      </div>

      {/* Input */}
      <div style={{ marginBottom: 12 }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste text here — any length, any source"
          style={{
            width: '100%', minHeight: 120, fontSize: 13,
            padding: '10px 12px', borderRadius: 6,
            border: `1px solid ${C.border}`, background: C.card,
            color: C.primary, resize: 'vertical', boxSizing: 'border-box',
            fontFamily: 'system-ui, sans-serif', lineHeight: 1.5,
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <input
            value={sourceLabel}
            onChange={e => setSourceLabel(e.target.value)}
            placeholder="Source label (optional — book, article, etc.)"
            style={{
              flex: 1, fontSize: 12, padding: '6px 10px',
              border: `1px solid ${C.border}`, borderRadius: 4,
              background: C.card, color: C.primary,
            }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.secondary, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={keepAsUnit}
              onChange={e => setKeepAsUnit(e.target.checked)}
            />
            keep as unit
          </label>
          <button
            onClick={analyze}
            disabled={!text.trim()}
            style={{
              fontSize: 12, fontWeight: 700, padding: '6px 18px',
              background: text.trim() ? C.accent : C.border,
              color: text.trim() ? '#fff' : C.muted,
              border: 'none', borderRadius: 4, cursor: text.trim() ? 'pointer' : 'default',
            }}
          >
            Analyze
          </button>
          {results && (
            <button
              onClick={clearResult}
              style={{
                fontSize: 12, padding: '6px 14px',
                background: C.card, color: C.muted,
                border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {results && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: C.muted }}>{results.length} sentence{results.length !== 1 ? 's' : ''} · {selected.size} selected</span>
            <button onClick={() => setSelected(new Set(results.map((_, i) => i)))}
              style={{ fontSize: 11, color: C.muted, background: 'none', border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>
              All
            </button>
            <button onClick={() => setSelected(new Set())}
              style={{ fontSize: 11, color: C.muted, background: 'none', border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>
              None
            </button>
            <button onClick={copyResults}
              style={{ fontSize: 11, color: C.secondary, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer', marginLeft: 'auto' }}>
              Copy results
            </button>
          </div>

          {results.map((result, i) => (
            <SentenceResult
              key={i}
              sentence={result}
              result={result}
              selected={selected.has(i)}
              onToggle={val => toggleSelect(i, val)}
              expanded={expanded.has(i)}
              onToggleExpand={() => toggleExpand(i)}
              entry={buildEntryFromSentence(result, result, sourceLabel, lang)}
            />
          ))}

          {allUnknown.length > 0 && (
            <div style={{
              background: C.warningBg, border: `1px solid ${C.warningBorder}`,
              borderRadius: 8, padding: '10px 14px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, color: C.warning, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Words not in system vocabulary
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {allUnknown.map(w => (
                  <span key={w} style={{
                    fontSize: 12, color: C.warning, background: '#fff',
                    border: `1px solid ${C.warningBorder}`, borderRadius: 3,
                    padding: '2px 8px',
                  }}>{w}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={addToPool}
              disabled={selected.size === 0}
              style={{
                fontSize: 12, fontWeight: 700, padding: '8px 20px',
                background: selected.size > 0 ? C.success : C.border,
                color: selected.size > 0 ? '#fff' : C.muted,
                border: 'none', borderRadius: 4,
                cursor: selected.size > 0 ? 'pointer' : 'default',
              }}
            >
              Add {selected.size} to pool
            </button>
            {status && <span style={{ fontSize: 12, color: C.success }}>{status}</span>}
          </div>
        </>
      )}
    </div>
  )
}
