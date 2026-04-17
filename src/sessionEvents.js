// Session Events — post-session hooks that fire after meaningful state changes.
//
// The core idea: instead of computing eligibility at the moment a practice
// prompt is requested, the system updates proactively when something changes.
// By the time the user hits practice again, the system already knows what's
// accessible — no live computation needed at serve time.
//
// When a hook fires:
//   onAttemptRecorded  — fires after every successful practice attempt.
//                        A word has just entered or progressed in a lane pool.
//                        This is the moment context eligibility can change for
//                        other words' prompts in the same lane.
//
// What the hook does now (stub):
//   refreshContentAvailability — checks which content items are newly eligible
//   given the updated pools. When contentStore items carry contextWords[],
//   this is where the selector cache gets updated.
//
// What the hook will do later:
//   triggerContentPrefetch — if eligible content for a word/lane is sparse
//   after the session, proactively queue a generation request so the next
//   session has something to pull from without an inline API call.
//
// Adding new post-session behavior: register a handler below.
// Nothing outside this file needs to change — callers just call
// notifyAttemptRecorded() and all registered handlers run.

const handlers = []

export function onAttemptRecorded(handler) {
  handlers.push(handler)
}

// state is passed in from userStore to avoid circular imports when handlers
// need to read the updated pool state.
export function notifyAttemptRecorded(wordId, laneId, result, state) {
  handlers.forEach(h => h(wordId, laneId, result, state))
}

// ── Registered handlers ───────────────────────────────────────

// Content availability refresh.
// After a word enters a lane pool, scan for content items that are now
// eligible (all their contextWords are in the updated pool) and update
// the availability snapshot. Currently a stub — activates once contentStore
// items carry contextWords[] and the snapshot cache is built.
onAttemptRecorded((wordId, laneId, result, state) => {
  // TODO: implement content availability refresh
  // 1. Read updated lane pool from state.wbPools[laneId] (passed in — no userStore import needed)
  // 2. For each word in state.wordBank, scan contentStore[word][laneId] items
  // 3. For items with contextWords[], check all contextWords are in the pool
  // 4. Write newly eligible item IDs to an availability snapshot in contentStore
  // This snapshot is what selectContent reads instead of recomputing per request.
})

// Content pre-fetch trigger (future).
// After eligibility refreshes, check if any word/lane combos are running low
// on eligible content. If so, queue a generation request so the next session
// doesn't have to wait for an inline API call.
onAttemptRecorded((wordId, laneId, result) => {
  // TODO: implement sparse content detection and pre-fetch queuing
  // 1. Check eligible item count per word/lane after the refresh above
  // 2. If count is below a threshold, add to a generation queue
  // 3. Generation queue runs in the background (not blocking the session)
})
