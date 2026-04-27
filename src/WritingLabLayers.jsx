import { useState } from 'react'
import { T, btn, Label } from './writingLabTheme'

export function LayerSection({ id, label, onGenerate, loading, prompt, showPrompt, onTogglePrompt, hasOutput, showOutput, onToggleOutput, children }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div style={{ marginBottom: 3, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden', background: T.card }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#dcdcde', borderBottom: collapsed ? 'none' : `1px solid ${T.border}` }}>
        <button onClick={() => setCollapsed(p => !p)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 10, color: T.textDim, flexShrink: 0, lineHeight: 1 }}>
          {collapsed ? '▶' : '▼'}
        </button>
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: T.layerTag, fontWeight: 700, flexShrink: 0 }}>{id}{label && <span style={{ fontWeight: 400, color: T.textDim }}> — {label}</span>}</span>
        <div style={{ flex: 1 }} />
        {!collapsed && onGenerate && (
          <button onClick={onGenerate} disabled={loading}
            style={{ ...btn('green', false), opacity: loading ? 0.5 : 1, cursor: loading ? 'default' : 'pointer', fontSize: 12, padding: '4px 14px' }}>
            {loading ? 'generating…' : 'generate'}
          </button>
        )}
        {!collapsed && (
          <button onClick={onTogglePrompt}
            style={{ ...btn('default', showPrompt), fontSize: 11, padding: '3px 10px' }}>
            {showPrompt ? 'hide prompt' : 'prompt'}
          </button>
        )}
        {!collapsed && hasOutput && (
          <button onClick={onToggleOutput}
            style={{ ...btn('default', showOutput), fontSize: 11, padding: '3px 10px' }}>
            {showOutput ? 'hide output' : 'output'}
          </button>
        )}
      </div>

      {!collapsed && <>
        {showPrompt && prompt && (
          <div style={{ borderBottom: `1px solid ${T.border}` }}>
            <div style={{ padding: '6px 14px 4px', background: '#d4cfc0' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#b07030', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Prompt</span>
            </div>
            <pre style={{ margin: 0, padding: '12px 14px', fontSize: 12, color: '#444', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7, background: '#d4cfc0' }}>
              {prompt}
            </pre>
          </div>
        )}
        {children}
      </>}
    </div>
  )
}

export function OutputBlock({ label, text, onCopy }) {
  return (
    <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: T.label, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label ?? 'Output'}</span>
        {onCopy && <button onClick={onCopy} style={{ ...btn(), fontSize: 11, padding: '2px 10px' }}>copy</button>}
      </div>
      <p style={{ margin: 0, fontSize: 16, color: T.text, lineHeight: 1.7 }}>{text}</p>
    </div>
  )
}
