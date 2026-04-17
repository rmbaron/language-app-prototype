// LaneLock — chunked lock visual for a single lane on a word profile.
//
// The lock dissolves in THRESHOLD chunks as the learner succeeds in this lane.
// Chunks dissolve left-to-right: each success dissolves the next chunk.
// When all chunks are dissolved (graduated), the lock is fully open.
//
// lane:        combined lane object from LANE — has .initial, .color, .id, .label, etc.
//              initial is a string today but can be swapped for any renderable node later.
// attempts:    0–threshold (capped by wordProgress)
// threshold:   how many attempts to dissolve all chunks (from userStore THRESHOLD)
// graduated:   word is in worldPools for this lane
// onMarkKnown: admin escape hatch — forces graduation. Will be removed when no longer needed.

export default function LaneLock({ lane, attempts, threshold, graduated, onMarkKnown }) {
  const chunks = Array.from({ length: threshold }, (_, i) => graduated || i < attempts)

  return (
    <div
      className={`lane-lock ${graduated ? 'lane-lock--open' : ''}`}
      style={{ '--lane-color': lane.color }}
    >
      <div className="lane-lock-badge">{lane.initial}</div>
      <div className="lane-lock-chunks">
        {chunks.map((dissolved, i) => (
          <div key={i} className={`lane-chunk ${dissolved ? 'lane-chunk--dissolved' : ''}`} />
        ))}
      </div>
      {!graduated && onMarkKnown && (
        <button className="lane-mark-known" onClick={onMarkKnown}>
          unlock
        </button>
      )}
    </div>
  )
}
