export default function StubScreen({ name, onBack }) {
  return (
    <div style={{ padding: '48px 24px', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button onClick={onBack} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#999', marginBottom: 32 }}>
        ← Back
      </button>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>{name}</h2>
      <p style={{ color: '#bbb', fontSize: 13 }}>Coming soon.</p>
    </div>
  )
}
