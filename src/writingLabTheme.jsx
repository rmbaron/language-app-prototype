export const T = {
  page:       '#d8d8da',
  card:       '#e8e8ea',
  border:     '#c4c4c6',
  borderHi:   '#aaaaac',
  text:       '#1a1a1a',
  textSub:    '#444',
  textDim:    '#777',
  textFaint:  '#999',
  label:      '#666',
  codeBg:     '#d0d0d2',
  codeText:   '#222',
  green:      '#1a5a1a',
  greenBg:    '#d8eed8',
  greenBord:  '#90c090',
  blue:       '#1a2a7a',
  blueBg:     '#d8e0f4',
  blueBord:   '#90a8d8',
  purple:     '#4a2a8a',
  purpleBg:   '#e0d8f4',
  purpleBord: '#a890d8',
  red:        '#7a1a1a',
  redBg:      '#f0d8d8',
  redBord:    '#d09090',
  layerTag:   '#1a5a1a',
}

export const btn = (variant = 'default', active = false) => {
  const variants = {
    default: { bg: '#fff', bord: T.border, color: T.textSub },
    green:   { bg: active ? T.greenBg  : '#fff', bord: active ? T.greenBord  : T.border, color: active ? T.green  : T.textSub },
    blue:    { bg: active ? T.blueBg   : '#fff', bord: active ? T.blueBord   : T.border, color: active ? T.blue   : T.textSub },
    purple:  { bg: active ? T.purpleBg : '#fff', bord: active ? T.purpleBord : T.border, color: active ? T.purple : T.textSub },
    red:     { bg: active ? T.redBg    : '#fff', bord: active ? T.redBord    : T.border, color: active ? T.red    : T.textSub },
  }
  const v = variants[variant] ?? variants.default
  return { background: v.bg, border: `1px solid ${v.bord}`, borderRadius: 4, color: v.color, cursor: 'pointer', fontSize: 12, padding: '5px 12px' }
}

export const rowBtn = (active) => ({
  textAlign: 'left', padding: '10px 12px', width: '100%',
  background: active ? T.greenBg : T.card,
  border: `1px solid ${active ? T.greenBord : T.border}`,
  borderRadius: 4, cursor: 'pointer', marginBottom: 4,
})

export const modeBtn = (active, variant = 'green') => {
  const map = { green: 'green', blue: 'blue', red: 'red', neutral: 'default' }
  return { ...btn(map[variant] ?? 'default', active), fontSize: 11, padding: '4px 10px' }
}

export function Label({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: T.label, textTransform: 'uppercase', marginBottom: 8 }}>{children}</div>
}

export function SlotOutput({ value }) {
  return (
    <div style={{ marginTop: 10, padding: '10px 12px', background: T.codeBg, borderRadius: 4, border: `1px solid ${T.border}` }}>
      <Label>Slot Output</Label>
      <pre style={{ margin: 0, fontSize: 12, color: T.codeText, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{value || '(empty)'}</pre>
    </div>
  )
}
