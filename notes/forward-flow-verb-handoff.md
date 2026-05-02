# Forward Flow Wiring — Verb Handoff

**Written:** 2026-05-02 by the previous Claude session.
**Audience:** the next Claude working on this codebase.
**Purpose:** so the user doesn't have to re-explain the thesis or the build order, and so the V wiring lands without repeating the mistakes that produced today's rework.

Read this whole file before touching any code.

---

## Why you're reading this

The user spent today realizing two structural things and then wiring the Subject (S) unit. You are picking up at Verb (V).

The two realizations, both load-bearing:

1. **Forward Flow had grown a parallel system to the old grammar circuit, and the new system didn't actually run end-to-end.** The Forward Flow tab got redesigned but wasn't reading off any working engine. A "shit ton" of S/V/O/C/A unit work was done yesterday but never wired through to the Live Panel.

2. **The architecture's purpose is not "a new validator."** It's a *deductive* forward-momentum machine. Each token commit *opens* (entails) the next slot's possibilities, and the **Live Panel is the proof surface where you can see the machine running**. If a sentence doesn't produce meaningful state in the panel, the engine isn't running and every product downstream — Constructor, peer chat, per-word validator — is bluffing.

Today's job, which is now your job, is wiring each unit so the panel narrates what the engine commits, what's still in play, and where things break. S is done. V is next.

---

## The thesis (compressed)

Read in full before writing code:

- `notes/macro-layer-sketch.md` — forward momentum as the test of correctness; verbs are the central engine; TAM and operations layers; multi-hypothesis at left edge.
- Memory `north_star_grammar_circuit` — composition over enumeration; factorial-feel = missing slot variable.
- Memory `project_forwardflow_v_unit` — V's compositional structure (different from S).

Key claims that should shape every decision you make:

- A primitive earns its place only if (a) it's detectable from what's typed, (b) it constrains what comes next, (c) it composes with the next primitive. A primitive that only makes sense once the whole sentence is in is the wrong primitive.
- "Detected from what's typed" is **causal**, not just temporal. The prior commit *opens* the next slot. The architecture is a chain of entailments — premises in, conclusions out.
- Grammar structures pre-exist as a fixed catalog. The user's typed prefix predicts which structures float up. Composition handles the long tail; enumeration is the failure mode.
- Top-down posture: shapes are the engine; atoms are the substrate. Bottom-up was always going to bog in the long tail.
- Live entailment checking is the same engine for the Constructor, peer chat, and the per-word validator V1. Three product surfaces, one engine. The Forward Flow tab is the engine naked.
- **Factorials are diagnostic.** Every place a factorial appears is a slot that hasn't been named yet. The architecture's job is to spot factorials and replace them with one rule of shape.

---

## What got wired for Subject today

The Subject unit had detection, families, multi-shape catalog, and shared-registry consolidation done in commit `75a5a5f` ("Update", 2026-05-02). None of that was visible in the Live Panel. Six wirings landed:

**Visible-state wirings**

1. **Family in live indicators.** Both `SubjectStatusBlock` preview and the live one-liner now show `Family → Shape` (e.g. `Bare / atomic → Bare pronominal · I · 1st singular`). Imports `getShapeFamily` in both files.
2. **Per-token engine reads.** Accordion expansion shows what `getCategory` returned for each token (`I:pronoun · want:?`), with `?` in amber for unknowns. Imports `getCategory`.
3. **Why-failed diagnostic.** When no shape matches, an amber banner names the categorical reason. Function `diagnoseSubjectFailure` lives in `detector.js`. Five cases: all-tokens-unknown, some-tokens-unknown, last-not-noun-head, single-token-not-head, generic-fallthrough.
4. **Token-level styling in the live one-liner.** `styledTokens` helper at the top of `LiveDetectionPanel.jsx`. Heads (noun/pronoun) bold + main color; modifiers italic; openers/coordinators dim; unknowns amber.

**Engine wirings**

5. **Multi-hypothesis output.** `liveSubjectHypotheses` in `detector.js` returns `[{ shape, state: 'matched'|'forming'|'extends-with', hint }]`. Forming/extends-with rows render as a "still in play" section in the accordion. Matched is suppressed because the preview already shows it.
6. **Detection branches for the 4 catalog-only structures.** `isPartitive`, `isForToInfinitive`, `isClausal`, `isNPWithPostmodifier` helpers in `detector.js`. Order in `detectSubjectShape`: `np_basic` first; then `np_with_postmodifier` if that fails; then `partitive`; then the legacy `to verb` infinitive shortcut; then `for_to_infinitive`; then `clausal`. Also flipped `detected: true` for those 4 in `src/forwardFlow/structures.en.js`. Also fixed a typo: `case 'clausal_subject'` → `case 'clausal'` in `computeSubjectFeatures`.

The Subject pattern is your template, but **don't apply it blindly to V** — see next section.

---

## How V differs from S (read this before writing code)

V uses a fundamentally different organizing principle than S.

| | Subject | Verb |
|---|---|---|
| Internal structure | Alternative shape catalog (pick one) | Compositional position chain (Modal + Perfect + Progressive + Passive + V) |
| Family-level concept | 5 phrasal-category families | 6 aux-cluster configurations (Bare / Modal-led / Perfect-led / Progressive-led / Passive-led / Do-support) |
| Multi-hypothesis | Edge case (specific tokens) | **Dominant operating mode** — be-aux Prog/Pass, frame ambiguity, have-aux vs lexical, do-support vs lexical |
| External impact | Just fills S slot | Commands the rest of the clause via frames |
| Operations | Coordination, possessive, partitive, post-modifier | Negation (decoration on operator), do-support, passive, inversion (operations layer not yet built — defer) |

The implication: V's "family" wiring is its `auxConfiguration`. V's "multi-hypothesis" wiring is the load-bearing one and isn't optional decoration like it was for S.

V's existing files are already split:
- `detector.js` — `matchVerb(token)` (direct + formsMap-resolved)
- `auxChain.js` — `classifyAuxToken`, `detectAuxConfiguration`, `ALL_AUX_AND_NEG`
- `agreement.js` — subject-verb agreement
- `frames.en.js` + `framesIndex.js` — argument structures per verb
- `auxConfigurations.en.js` + `auxConfigurationsIndex.js` — the 6 named configs
- `internalChain.en.js` + `internalChainIndex.js` — chain positions catalog
- `verbFramesBootstrap.en.js`
- `frameLibrary.js`
- `StatusBlock.jsx` (orchestrator) + `statusBlocks/` sub-blocks: `AgreementIssue.jsx`, `AuxChain.jsx`, `VerbExpected.jsx`, `VerbMatched.jsx`
- Sub-tabs: `VerbSubTabContent.jsx`, `FrameSubTabContent.jsx`, `InternalSubTabContent.jsx`, `ConfigurationsSubTabContent.jsx`, `ChainCard.jsx`, `FrameCard.jsx`

So V already has more surface area than S. Most of the wiring job is making sure that surface is *flowing* with live state from `useParsedSentence`, not adding new structure.

`useParsedSentence` already exposes for V: `matchedVerb`, `matchedVerbForm` (`{surface, base, type}`), `auxChain` (array of `{token, slot}`), `auxConfiguration`, `expectedAgreement`, `agreementCheck`, `matchedChainIds` (Set). Read those plumbed-through fields first; you'll find a lot is already in flight.

---

## What to wire for V — the six analogs

Adapt the Subject pattern. Each adaptation is meaningful, not mechanical.

**1. Aux-configuration in live indicators (analog of "family in indicators").**
- V's `auxConfiguration` is its family-level concept. Verify the live one-liner and `VerbStatusBlock` preview show it (Bare / Modal-led / etc.). If they don't, surface it.
- Show the matched lexical verb prominently; show the configuration as the framing layer. E.g. `V [is running] (Progressive-led, frame: SV)`.

**2. Per-token engine reads for the V region.**
- V region = aux chain tokens + matched lexical verb token. For aux tokens, the useful "category" is the chain `slot.id` (`modal` / `perfect` / `be_aux` / `do_support` / `negation`). For the lexical verb, surface `matchedVerbForm.type` (e.g. `past_participle`, `bare`, `present_3sg`).
- **Code-bloat decision point:** Subject's StatusBlock has `tokenCats` and LiveDetectionPanel has `styledTokens`. Both call `getCategory`. That's 2 sites. When V needs the same thing, that's the 3rd site — **hoist to `useParsedSentence`** and emit a `parsed.tokenInfo` array (per-token `{token, category, slotRole, ...}`). Don't duplicate a third time.

**3. Why-failed diagnostics for V.**
- Add `diagnoseVerbFailure(tokens, verbIndex, ...)` in `detector.js`. Render in an amber banner inside `VerbStatusBlock` when no verb matched.
- Failure reasons worth distinguishing:
  - No token in the post-S region matched any verb in the registry (`matchVerb` returned null for every token).
  - Aux chain present but no lexical verb followed (chain trails off).
  - Agreement mismatch (subject features expect form X but matched form is Y) — already partially surfaced by `agreementCheck`; verify it's visible.
  - Do-support fired in non-NICE context (would need detector logic to flag).
  - Modal followed by non-bare form (e.g. "will runs" — modal expects bare verb).

**4. Token-level styling in the V portion of the live one-liner.**
- Each V-region token gets role styling. Aux tokens color-coded by `slot.id` (or just dim with role label). Negation italic. Lexical verb head bold + the V color (amber per the theme).
- If you've hoisted `tokenInfo` to `useParsedSentence` per (2), this becomes a simple consumer.

**5. Multi-hypothesis output for V — the load-bearing one.**
- V's multi-hypothesis is dominant, not edge-case. The architecture must hold parallel candidate trajectories at:
  - **be-aux ambiguity** ("is/are/was/were" → progressive OR passive; resolves at next form)
  - **have-aux vs lexical "have"** ("has/had/have" → perfect aux OR lexical; resolves at next form)
  - **do-support vs lexical "do"** ("do/does/did" → do-support, only legal in NICE context, OR lexical)
  - **frame ambiguity** (most verbs have multiple frames: eat → SV or SVO; give → SVOO or SVO+A; want → SVO or SVO_inf)
- Add `liveVerbHypotheses(...)` in `detector.js` returning `[{ configuration|frame, state: 'matched'|'forming'|'ambiguous', hint }]`.
- The configuration `'be_led_ambiguous'` (per memory) already encodes one ambiguity case — confirm it exists in code, then surface it in the panel as parallel-hypothesis state.
- For frame ambiguity: `parsed.matchedVerb.frames` is an array. `useParsedSentence` currently picks one heuristically (around line 141-152). Don't change the picker logic. Instead expose ALL non-ruled-out frames as hypotheses so the panel shows them in parallel.

**6. Detection branches not yet wired.**
- Audit `auxConfigurations.en.js` and check that `detectAuxConfiguration` actually emits each named configuration. Verify all 6 fire on real input.
- Audit `framesIndex.js` for any frames marked `detected: false`. Likely candidates needing wiring: ditransitive (SVOO), resultative (SVOC), motion (SVA / SVOA). Wire missing branches.
- **Do NOT add the Operations layer yet** (negation, inversion, passive surface mapping, do-support insertion logic). The macro-layer-sketch treats this as a separate phase. Defer.

---

## Mistakes to avoid (these were paid for in real time)

**1. Don't build a parallel system.** When you add a new schema/registry/index/helper, name what it retires. If you can't name a kill target, stop. The Forward Flow bubble (today's diagnosis) is the cautionary tale. Memory: `feedback_kill_list_with_every_schema_piece`.

**2. Don't do UI redesign before the data binding is real.** Build order is engine → wire → surface. The Forward Flow tab redesign today was built before the wiring; that's the mistake we spent the day recovering from. The redesigned panel can stay; rewire it to a real engine.

**3. Don't treat Live Panel silence as "different strategy."** Earlier today I (the previous Claude) called "I want" failing-to-detect a "different search strategy, not a bug." That was wrong. The panel is the proof surface for the thesis. Silence on partial input is engine-off, period. Either the engine isn't running or the surface isn't showing what the engine knows.

**4. Don't extract abstractions prematurely, but don't duplicate at 3+.** Currently the token-category compute is at 2 sites (`tokenCats` in S StatusBlock, `styledTokens` in LiveDetectionPanel). When V needs the same thing, that's the 3rd site — that's when to hoist to `useParsedSentence`. Memory: `feedback_stay_in_scope`.

**5. Don't fan out beyond named scope.** When wiring V, don't touch O/C/A. The user explicitly works one unit at a time. Same applies after V — pause before O.

**6. Don't act on the kill list yet.** The doc at `notes/grammar-circuit-kill-list.md` was written this morning when the framing was migration-first. The user's reframe later that day was: the new system has to *demonstrate the thesis* before retirement is meaningful. That means wiring V/O/C/A first. The kill list stays on the shelf until then.

**7. Don't apply Subject's pattern blindly to V.** V is compositional, not catalog. Family-equivalent is aux configuration. Multi-hypothesis is dominant. Read the V memory before writing code.

**8. Don't summarize what you just did at the end of every response.** The user reads diffs.

---

## How to work

- **Use TodoWrite** to track the 6 V wiring jobs as you go. Mark in-progress before starting; complete immediately after finishing.
- **Check in with the user after each wiring**, even with prior approval. Memory: `feedback_check_between_tasks`. Especially load-bearing for V because of the multi-hypothesis decisions.
- **Keep edits small and targeted.** The user burns out fast on grammar-circuit sessions. Memory: `feedback_token_cost_discipline`.
- **Edit, don't Write**, on existing files.
- **If you're about to add a function over ~25 lines, ask first.** Diagnostic functions tend to grow; the user has flagged that as a watchpoint.
- **If you spot a factorial in V** (e.g. enumerated patterns where one slot rule would do), name it and pause. That's a slot waiting to be discovered, not a list to enumerate. North-star principle.
- **Stale TypeScript diagnostics** about "declared but unused" fire between sequential Edits when the import is added before its consumer. Re-read the final file to confirm — don't act on stale hints.

---

## Files to read first, in order

1. `notes/macro-layer-sketch.md` — the thesis
2. Memory: `north_star_grammar_circuit` — composition over enumeration
3. Memory: `project_forwardflow_v_unit` — V's structure
4. Memory: `project_forwardflow_unit_layout` — folder layout
5. This doc (`notes/forward-flow-verb-handoff.md`)
6. `src/forwardFlow/units/subject/detector.js` — the wiring template (especially `diagnoseSubjectFailure`, `liveSubjectHypotheses`, the `is*` helpers)
7. `src/forwardFlow/units/subject/StatusBlock.jsx` — the visible-state template
8. `src/forwardFlow/LiveDetectionPanel.jsx` — `styledTokens` helper at top, subject-portion render around the middle
9. `src/forwardFlow/useParsedSentence.js` — the orchestrator; this is where you'll likely hoist `tokenInfo` for the 3rd-site rule
10. `src/forwardFlow/units/verb/*` — V's existing files; map each to one of the 6 wiring jobs

---

## Definition of done for V

When you finish all 6 V wirings, type each of these into the Live Panel and verify each produces meaningful state:

- "I run." — bare configuration, frame SV
- "She runs." — bare, agreement check fires
- "She is happy." — bare with copula, frame SVC
- "I am running." — progressive-led, expected frame SV
- "She has eaten." — perfect-led
- "I will go." — modal-led, projects bare
- "Did you eat?" — exception lane (yes/no question), do-support
- "I want to leave." — frame SVO_inf (or however that's named)
- "She made him cry." — frame SVOC with bare-VP small clause
- "He gave me a book." — frame SVOO (ditransitive)

For each that does NOT produce meaningful state, identify whether it's:
- An unwired branch (engine has the logic but the surface doesn't show it),
- A missing factorial-collapse (the catalog enumerates instead of composing),
- Or a registry gap (the lexical verb isn't in `wordRegistry` or `frames.en.js`).

Report which, then **check in with the user** about whether to proceed to O. Don't silently start O.

---

## Concrete task list — execute in this order

The previous Claude planned this list before the next session. Use TodoWrite to track. Check in with the user after every task — small commits, no batching.

**Phase A — visible-state wirings (smaller, fastest payoff):**

1. **Audit `auxConfiguration` surfacing.** Verify it shows in (a) the live one-liner (LiveDetectionPanel) and (b) `VerbStatusBlock` preview. If it doesn't appear, surface it — analogous to how Subject's family was surfaced. Look for: which configuration is matched ("Bare", "Modal-led", "Perfect-led", "Progressive-led", "Passive-led", "Do-support", "be_led_ambiguous").
2. **Audit `matchedVerbForm.type` surfacing.** The lexical verb form type (bare / past / present_3sg / past_participle / -ing) is in `parsed.matchedVerbForm.type`. Verify it appears in the V status block. If not, surface it.
3. **Per-token engine reads for the V region.** Build the third "what does the engine see per token" surface. **At this point, hoist `tokenInfo` to `useParsedSentence`** — Subject has `tokenCats` (StatusBlock) and `styledTokens` (LiveDetectionPanel); V is the third site. Emit `parsed.tokenInfo` as `[{token, category, slotRole}]`. Refactor S's two consumers and the new V consumer all to read from `parsed.tokenInfo`. This is the extract-at-3 moment.
4. **Why-failed diagnostic for V** (`diagnoseVerbFailure` in `units/verb/detector.js`). Cases worth distinguishing: no token in post-S region matched any verb in registry; aux chain present but no lexical verb followed; agreement mismatch (already partially in `agreementCheck` — verify it's visible); modal followed by non-bare form; do-support fired in non-NICE context. Render in amber banner inside `VerbStatusBlock`.
5. **Token-level styling for V tokens in the live one-liner.** Aux tokens dim or color-coded by `slot.id`; negation italic; lexical verb head bold + V-color (amber). Consume from `parsed.tokenInfo` per (3).

**Phase B — engine wirings (bigger):**

6. **Multi-hypothesis output for V — `liveVerbHypotheses`.** This is V's load-bearing wiring. Surface parallel candidate trajectories at:
   - **be-aux Prog/Pass ambiguity** ("is/are/was/were" → progressive OR passive; resolves at next form). Note: `auxConfiguration: 'be_led_ambiguous'` may already encode this — confirm and surface.
   - **have-aux vs lexical "have"** ("has/had/have" → perfect aux OR lexical verb).
   - **do-support vs lexical "do"** ("do/does/did" → do-support only legal in NICE context, else lexical).
   - **Frame ambiguity** (most verbs have multiple frames — eat → SV/SVO; give → SVOO/SVO+A; want → SVO/SVO_inf). Don't change the frame picker in `useParsedSentence` (around lines 141-152). Expose all non-ruled-out frames as parallel hypotheses.
   - Render as a "still in play" section in `VerbStatusBlock` analogous to Subject's.

7. **Audit `auxConfigurations.en.js` and `framesIndex.js` for catalog-only entries.** For each `detected: false` flag, decide: wire it, or leave catalog-only with reason. Most likely needing wiring: ditransitive (SVOO), resultative (SVOC), motion-A (SVA / SVOA). Keep helpers in `units/verb/detector.js` next to `matchVerb`.

**Definition of done — type these into Live Panel:**

- `I run.` → bare configuration, frame SV
- `She runs.` → bare, agreement check fires
- `She is happy.` → bare with copula, frame SVC
- `I am running.` → progressive-led, frame SV
- `She has eaten.` → perfect-led, frame SV (or SVO depending on lexical "eaten")
- `I will go.` → modal-led, projects bare
- `Did you eat?` → exception lane (yes/no question), do-support
- `I want to leave.` → frame SVO_inf or similar
- `She made him cry.` → frame SVOC (small-clause object)
- `He gave me a book.` → frame SVOO (ditransitive)

For each that doesn't produce meaningful state, identify whether it's an unwired branch, a missing factorial-collapse, or a registry gap. **Then check in with the user** before starting O.

**Do NOT in this session:**
- Touch O, C, or A
- Build the Operations layer (negation, inversion, passive surface mapping, do-support insertion logic) — that's a separate phase per `notes/macro-layer-sketch.md`
- Migrate or delete anything from the old grammar circuit
- Add new schema/registry/index pieces without a kill target

## Closing note

The work is real and the thesis is real. Don't get clever. Don't fan out. Wire the unit, run the panel, check in. The Subject wiring is the proof that this approach works; V is the second proof; if V fails to wire cleanly, that itself is information about whether the architecture's compositional posture holds at the V level — better to discover that early than after stacking O/C/A on top.

Good luck.
