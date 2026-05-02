// Findings — top-level "Forward Flow as discovery surface" view.
//
// As Forward Flow grows, it surfaces gaps in the broader system — things
// this dev surface can detect that the rest of the app can't yet handle.
// Each finding names what surfaced it, what's missing, the current
// workaround (if any), and where the fix lives.
//
// Mirror of notes/forward-flow-findings.md.
//
// State (search query + group-by) lives in this component now — no need
// to surface it to the orchestrator since nothing else reads it.

import { useState } from 'react'
import { T } from '../theme'
import { Section } from '../primitives'
import { FORWARD_FLOW_FINDINGS } from '../../forwardFlowFindings.en.js'

export function FindingsSubTabContent() {
  const [search,  setSearch]  = useState('')
  const [groupBy, setGroupBy] = useState('status') // 'status' | 'priority' | 'none'

  const filtered = FORWARD_FLOW_FINDINGS.filter(f => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return [f.title, f.surfacedBy, f.missing, f.workaround, f.fix].some(s => (s ?? '').toLowerCase().includes(q))
  })

  let groups
  if (groupBy === 'status') {
    groups = [
      { label: 'Open',     items: filtered.filter(f => f.status === 'open') },
      { label: 'Resolved', items: filtered.filter(f => f.status === 'resolved') },
    ]
  } else if (groupBy === 'priority') {
    groups = [
      { label: 'Important', items: filtered.filter(f => f.priority === 'important') },
      { label: 'Can wait',  items: filtered.filter(f => f.priority === 'can wait') },
      { label: 'Resolved',  items: filtered.filter(f => f.status === 'resolved') },
    ]
  } else {
    groups = [{ label: null, items: filtered }]
  }

  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: T.textDim, textTransform: 'uppercase', marginBottom: 8 }}>
        Forward Flow as discovery surface · gap log
      </div>
      <Section>Findings ({FORWARD_FLOW_FINDINGS.filter(f => f.status === 'open').length} open · {FORWARD_FLOW_FINDINGS.filter(f => f.status === 'resolved').length} resolved)</Section>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
        As Forward Flow grows, it surfaces gaps in the broader system — things this dev surface can detect that the rest of the app can&apos;t yet handle. Each finding names what surfaced it, what&apos;s missing, the current workaround (if any), and where the fix lives. Mirror of notes/forward-flow-findings.md.
      </div>

      {/* Search + group-by controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="search findings…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '6px 10px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, boxSizing: 'border-box' }} />
        <span style={{ fontSize: 10, color: T.textDim, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>group by</span>
        {['status', 'priority', 'none'].map(g => (
          <button key={g} onClick={() => setGroupBy(g)}
            style={{
              padding: '4px 10px', fontSize: 11, fontWeight: 600,
              border: `1px solid ${groupBy === g ? T.text : T.border}`, borderRadius: 4,
              background: groupBy === g ? T.text : '#fff',
              color:      groupBy === g ? T.page : T.textDim,
              cursor: 'pointer',
            }}>{g}</button>
        ))}
      </div>

      {groups.map((group, gi) => group.items.length === 0 ? null : (
        <div key={gi} style={{ marginBottom: 16 }}>
          {group.label && (
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: T.label, textTransform: 'uppercase',
              marginBottom: 6, paddingBottom: 4, borderBottom: `1px solid ${T.border}`,
            }}>
              {group.label} ({group.items.length})
            </div>
          )}
          {group.items.map(f => <FindingCard key={f.id} f={f} />)}
        </div>
      ))}
    </>
  )
}

function FindingCard({ f }) {
  const isResolved = f.status === 'resolved'
  const priorityColor =
    f.priority === 'critical'  ? T.red   :
    f.priority === 'important' ? T.amber :
    T.textDim
  return (
    <div style={{
      background: isResolved ? T.greenBg : T.card,
      border: `1px solid ${isResolved ? T.greenBord : T.border}`,
      borderRadius: 6, padding: '12px 14px', marginBottom: 8,
      opacity: isResolved ? 0.75 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: T.textDim, fontFamily: 'monospace', minWidth: 28,
        }}>#{f.id}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.text, flex: 1 }}>
          {isResolved && <span style={{ textDecoration: 'line-through' }}>{f.title}</span>}
          {!isResolved && f.title}
        </span>
        <span style={{
          padding: '1px 7px', background: '#fff', border: `1px solid ${priorityColor}`, color: priorityColor,
          borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{f.priority}</span>
        <span style={{
          padding: '1px 7px', background: isResolved ? T.greenBg : '#fff', border: `1px solid ${isResolved ? T.greenBord : T.border}`,
          color: isResolved ? T.green : T.textDim, borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{f.status}</span>
      </div>
      <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.55, marginBottom: 4 }}>
        <b style={{ color: T.label }}>Surfaced by:</b> {f.surfacedBy}
      </div>
      <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.55, marginBottom: 4 }}>
        <b style={{ color: T.label }}>What&apos;s missing:</b> {f.missing}
      </div>
      <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.55, marginBottom: 4 }}>
        <b style={{ color: T.label }}>Workaround:</b> {f.workaround}
      </div>
      <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.55 }}>
        <b style={{ color: T.label }}>Fix:</b> {f.fix}
      </div>
    </div>
  )
}
