# Grammar Circuit — Kill List

Compiled 2026-05-02. The artifact called for in `session_letter.md` after the
parallel-pipeline diagnosis: for each piece of the old grammar circuit, name
the new piece that replaces it, or call it a true gap.

> "Why is there a parallel system at all it was one system whyyyyyyyyy."

The two systems share only the data substrate (atoms, word registry, formsMap,
L2 fields). No orchestrator imports both. They are siblings, not layers.

---

## The two surfaces

| Surface | Top-level file | Validator | Output |
|---|---|---|---|
| **Old: Grammar Breaker** | `GrammarBreakerScreen.jsx` | `validateSentence()` in `grammarBreaker.js` | Pattern fires + license verdicts (atom-grid retrospective) |
| **New: Forward Flow** | `GrammarBreakerForwardFlowTab.jsx` | `useParsedSentence()` in `forwardFlow/useParsedSentence.js` | Per-unit shape commitments (left-to-right prospective) |

The old system asks **"which patterns fired across this token grid?"** The new
system asks **"as I read left-to-right, what shape is each slot taking?"**
Different questions. Same input. Both run on shared atoms/registry.

This is why "I want" doesn't detect anything in Forward Flow's
`LiveDetectionPanel`: prospectively, after one token "I", the subject NP has
committed to `bare_pronominal` and we're waiting for V. The old system would
have already fired `subject_pronoun` and noted the absence of a verb.

---

## Old grammar circuit — module inventory

| File | What it does | Exports |
|---|---|---|
| `src/grammarBreaker.js` | Tokenizes input, runs every pattern's detector against the token grid, evaluates licenses against active atoms, enforces token coverage. | `tokenize`, `validateSentence` |
| `src/grammarBreakerPatterns.js` | Aggregates all pattern files; validates each pattern record at module load; exposes the live `PATTERNS` list. | `PATTERNS`, `INVALID_PATTERNS`, `PATTERNS_BY_ID`, `PATTERN_TYPES` |
| `src/grammarBreakerCouplings.js` | Level-3 / Level-4 structural concept layer. Couplings = micro-relations (`subject_verb`, `verb_object`); composites = macro-shapes (`svo_clause`). Patterns declare which coupling they implement. | `COUPLINGS`, `COMPOSITES` |
| `src/grammarBreakerConfig.js` | Per-pattern, per-group, master enable/disable flags. Read by validator at runtime. | `isPatternEnabled`, `setPatternEnabled` |
| `src/grammarPatterns/*.js` | 8 files of micro-pattern detectors: clausePatterns, nounPhrasePatterns, verbChainPatterns, adverbialPatterns, connectorPatterns, pronominalPatterns, morphologyPatterns, _helpers. | Pattern arrays |

## New Forward Flow — module inventory

| File | What it does |
|---|---|
| `forwardFlow/structures.en.js` | Single registry of structures (NP, AdjP, PP, AdvP, gerund, infinitive, clausal, coordinated, partitive, etc.) — the fillers slots accept. |
| `forwardFlow/shapeFamilies.en.js` | Phrasal-category layer (5 families + AdjP/PP/AdvP) sitting between units and individual structures. |
| `forwardFlow/useParsedSentence.js` | Top-level orchestrator. Tokenizes, dispatches lane (fundamental/exception), drives each unit's detector in order, composes cross-unit deps (S→V agreement). |
| `forwardFlow/categoryLookup.js` + `wordCategories.en.js` | Word-category lookup; closed-class function-word map. |
| `forwardFlow/units/{subject,verb,object,complement,adverbial,exceptions}/` | Per-unit detectors + acceptance lists + UI fragments. |
| `forwardFlow/{np,adjp,pp,advp}/match.js` | Shared phrase matchers — `np/match.js` is used by S and O. |
| `forwardFlow/units/verb/{frames.en.js, framesIndex.js, frameLibrary.js, auxChain.js, auxConfigurations.en.js, agreement.js, internalChain.en.js}` | Verb's compositional layout (different from S/O/C/A). |
| `forwardFlow/LiveDetectionPanel.jsx` | The prospective input box + per-unit accordion. The visible surface where the gap shows up. |
| `derivedFormsIndex.js`, `featureIndex.js`, `vocabularies.en.js` | Pipeline-side indexes (recommender feeds), not parsing-side. Sibling to `atomIndex`. |

---

## Kill list

For each old piece: REPLACED BY (with the gap noted), TRUE GAP, or STILL LIVE
(the shared substrate).

| OLD | VERDICT | NOTES |
|---|---|---|
| `validateSentence()` | **REPLACED BY `useParsedSentence()`** | Different search strategy: retrospective grid vs prospective parse. Old emits N firings per sentence; new emits one commitment per slot. **Gap:** new doesn't yet emit the "this should have happened but didn't" verdicts the old produces. |
| `PATTERNS` registry | **REPLACED BY per-unit detectors** | Detectors now scattered across `units/*/detector.js` + shared phrase matchers. **Gap:** no licensing layer — Forward Flow detectors all run unconditionally, no `requiresAtoms`. |
| Pattern detector files (8) | **REPLACED BY shape matchers + frame routing** | Mapping: subject_verb/verb_object ↔ V detector + frames; copula_complement ↔ C detector; adverbial_position ↔ A detector. **Gaps:** (1) coordinated NP detection inlined into `np/match.js`, no dedicated pattern; (2) morphology patterns (past `-ed`, progressive `-ing`, possessive `'s`) have no Forward Flow equivalent; (3) per-pattern info messages don't have a forward-flow equivalent yet. |
| `COUPLINGS` (Level 3) | **TRUE GAP — no replacement yet** | `structures.en.js` defines fillers, not relations. Old couplings (`subject_verb`, `verb_object`, `modal_verb_chain`) describe slot-to-slot bindings. Forward Flow has these implicitly inside `useParsedSentence` (S→V agreement, V→O via frames) but they are not first-class data. |
| `COMPOSITES` (Level 4) | **TRUE GAP — no replacement yet** | Macro-shapes (`svo_clause`, `there_existential`) are the most natural analog to "what kind of clause is this." Forward Flow's exception-lane dispatch (`units/exceptions/`) starts to cover this for non-default openers but is not a registry. |
| `grammarBreakerConfig.js` | **TRUE GAP — no replacement yet** | Per-pattern toggles for dev. Forward Flow has no enable/disable mechanism. |
| `tokenize()` (old) | **REPLACED BY ad-hoc tokenization in detectors** | Both go word-by-word; new system tokenizes inside each detector via `categoryLookup`. **Gap:** there's no shared tokenize step in Forward Flow, so token-level fields (atoms, L2) are re-derived per unit. |
| Atom data (`grammarAtoms.js`, `atoms.en.js`) | **STILL LIVE — shared** | Old gates patterns on atom membership. New mostly does form/category-based matching but reads atom membership in some places (verb, subject pronoun). |
| `wordRegistry.js` | **STILL LIVE — shared** | Both read `baseForm`, `grammaticalAtom`, `alternateAtoms`, L2 fields. |
| `formsMap` | **STILL LIVE — shared** | Old uses inside `tokenize()`; new uses inside `verb/detector.js`. |

## Shared substrate

These are NOT in the kill list — both systems read them and that's correct:

- `wordRegistry.js` (L1 seed + L2 enrichment)
- `formsMap` (surface ↔ base, irregulars + regular inflections)
- `grammarAtoms.{js,en.js}` (atom vocabulary)
- `wordCategories.en.js` (closed-class function-word map — only new uses it today, but old's `_helpers` could be migrated to it)
- L2 fields on word records (countability, transitivity, verbAspectClass, etc.)

The substrate is unified. Everything above the substrate has parallel implementations.

## Pipeline-side indexes (different concern)

`derivedFormsIndex.js`, `featureIndex.js`, `vocabularies.en.js`, and `atomIndex.js` are **runtime pools written by the L2 enrichment pipeline and read by the recommender / Constructor / Library views**. They are not parsing infrastructure; neither old nor new validator reads them. They live on the same axis as `wordRegistry` (data layer), not on the validator axis. They aren't in the kill list — they are NEW infrastructure with no old equivalent.

---

## Recommended single rip-and-replace wedge

Per the session letter, the kill list should produce one small wedge to validate
the migration approach in practice.

**Wedge: retire `verbChainPatterns.js` in favor of `units/verb/`.**

Why this one:
- **Smallest blast radius.** The verb chain is one domain; `verbChainPatterns.js` is ~150 lines covering modal+verb, perfect+verb, do-support, progressive — all of which `auxChain.js` + `auxConfigurations.en.js` + `agreement.js` already cover *compositionally* in Forward Flow.
- **Already feature-complete on the new side.** Verb is the most-developed unit (frame library, agreement, aux chain). Other units have looser coverage.
- **Low coupling outward.** verbChainPatterns is referenced by `grammarBreakerPatterns.js` and not re-exported elsewhere. Removing it requires updating one aggregator and the screen that displays old-validator output.
- **Reveals the licensing gap immediately.** The old patterns gate on atoms (`requiresAtoms: ['modal_auxiliary', 'lexical_verb']`); the new system doesn't. The wedge will force us to design — or explicitly defer — the licensing layer.

**What we'd actually do** (later, not now — this is the recommendation, not the work):
1. Build a thin "old-validator-shaped" adapter that wraps `useParsedSentence`'s verb commitment into pattern-fire-style records.
2. Switch `grammarBreakerPatterns.js` to source verb-chain firings from the adapter.
3. Delete `verbChainPatterns.js`.
4. Confirm GrammarBreakerScreen still renders verb-chain firings correctly.
5. If it works: repeat for `nounPhrasePatterns.js` (subject/object), then `clausePatterns.js`. Stop and reassess at each step.

If we can't even do verb-chain cleanly, the kill list itself needs revision —
that's the validation.

## What this kill list does NOT decide

- Whether the old GrammarBreakerScreen survives at all (might just be the dev
  surface for old until everything moves; might be retired entirely).
- Whether COUPLINGS get a Forward Flow equivalent or are quietly retired
  (the slot-to-slot relations live inside `useParsedSentence` already; making
  them first-class is a real architectural choice).
- The licensing layer — should it return at all? Atoms-as-gates was the old
  design. Forward Flow seems to be moving toward "always run, surface what's
  ready" — different philosophy.
- Whether morphology patterns (past-tense -ed etc.) need a parsing-time
  equivalent or whether they belong to enrichment-time.

These are the questions the wedge will surface in real terms.
