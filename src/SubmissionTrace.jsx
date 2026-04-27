import { T } from './writingLabTheme'

function TraceRow({ label, children, accent }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ width: 80, flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent ?? T.label, paddingTop: 2 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 12, color: T.textSub, lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

function Chip({ text, color, bg, border }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${border}`, marginRight: 4, marginBottom: 3 }}>
      {text}
    </span>
  )
}

export default function SubmissionTrace({ trace }) {
  if (!trace) return null
  const { circuit, evaluation, store } = trace

  return (
    <details open style={{ marginTop: 14, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
      <summary style={{ padding: '8px 14px', background: '#dcdcde', cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.label, userSelect: 'none' }}>
        submission trace
      </summary>
      <div style={{ padding: '4px 14px 10px', background: T.card }}>

        <TraceRow label="circuit">
          <div style={{ marginBottom: 4 }}>
            {circuit.bankedTokens.map(t => (
              <Chip key={t.surface} text={`${t.surface} → ${t.baseId}`} color={T.green} bg={T.greenBg} border={T.greenBord} />
            ))}
            {circuit.constructions.map(t => (
              <Chip key={t.surface} text={`[${t.constructionType}] ${t.surface}`} color='#7a4000' bg='#fde8c8' border='#d8a050' />
            ))}
            {circuit.unknownTokens.map(w => (
              <Chip key={w} text={`? ${w}`} color={T.red} bg={T.redBg} border={T.redBord} />
            ))}
            {circuit.bankedTokens.length === 0 && circuit.constructions.length === 0 && (
              <span style={{ color: T.textDim, fontSize: 11 }}>no banked words detected</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: T.textDim }}>
            creditable: {circuit.creditableIds.length > 0 ? circuit.creditableIds.join(', ') : '—'}
          </div>
        </TraceRow>

        <div style={{ fontSize: 11, color: T.textDim, padding: '4px 0 4px 80px' }}>↓ {circuit.creditableIds.length} word{circuit.creditableIds.length !== 1 ? 's' : ''} eligible</div>

        <TraceRow label="evaluate" accent={evaluation.pass ? T.green : T.red}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 4, flexWrap: 'wrap' }}>
            <span>content words: <b>{evaluation.contentCount}</b></span>
            <span>unknown: <b style={{ color: evaluation.unknownCount > 0 ? T.red : T.green }}>{evaluation.unknownCount}</b></span>
            <span>quality: <b>{(evaluation.quality * 100).toFixed(0)}%</b></span>
          </div>
          <div style={{ fontWeight: 600, color: evaluation.pass ? T.green : T.red }}>
            {evaluation.pass ? '✓ PASS' : '✗ FAIL'} — {evaluation.feedback}
          </div>
        </TraceRow>

        <div style={{ fontSize: 11, color: T.textDim, padding: '4px 0 4px 80px' }}>
          {evaluation.pass ? `↓ recording ${store?.length ?? 0} word${store?.length !== 1 ? 's' : ''} at quality ${(evaluation.quality * 100).toFixed(0)}%` : '↓ blocked — nothing recorded'}
        </div>

        <TraceRow label="store" accent={store ? T.green : T.textDim}>
          {store ? (
            <div>
              {store.map(w => (
                <div key={w.wordId} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, color: T.text, width: 80 }}>{w.wordId}</span>
                  <span style={{ color: T.textDim }}>writing</span>
                  <span style={{ color: T.textDim }}>{w.before} → <b style={{ color: T.green }}>{w.after}</b></span>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ color: T.textDim }}>nothing written — evaluation did not pass</span>
          )}
        </TraceRow>

      </div>
    </details>
  )
}
