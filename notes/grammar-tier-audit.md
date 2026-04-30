# Grammar Constructor — Tier Audit & Architecture Notes

Compiled 2026-04-30 for the user to review before redesigning the constructor tiers. Today's session is building the validator architecture; the actual tier content is yours to redesign. This doc is the input to that redesign — what's there now, what's broken or missing, and what the options are.

---

## Part 1 — The existing tiers (current state)

Source: [src/constructorTiers.en.js](../src/constructorTiers.en.js)

Each tier introduces atoms and a slot configuration. The current model treats tiers as cumulative slot templates: a tier specifies which slots are present and what each accepts.

| Tier | Band / Cluster | Label | New atoms | Slots | Examples |
|---|---|---|---|---|---|
| T1 | 1 | Subject + Verb | `personal_pronoun`, `lexical_verb` | subject_noun (pronoun only), verb (lex only) | I eat. She runs. |
| T2 | 1 | + Noun / Object | `noun`, `object_pronoun` | + interjection (opt), object | I want food. She likes him. Wow, I like music. |
| T3 | 2 | + Copula / Complement | `copula`, `adjective` | subject (pronoun), verb=copula, complement | I am happy. She is tired. |
| T4 | 2 | + Determiner | `determiner`, `possessive_determiner`, `demonstrative` | + determiner; subject_noun=noun (forced) | The friend eats. My cat sleeps. |
| T5 | 2 | + Attributive Adjective | (none — structural) | + subject_adjective | A good friend helps. |
| T6 | 3 | + Adverbial | `adverb`, `preposition` | + adverbial (accepts adverb only) | I eat here. She works now. |
| T7 | 4 | + Modal | `modal_auxiliary` | + modal; verb=lex only | I can help. She will eat. |
| T8 | 4 | + Negation | `negation_marker`, `auxiliary` | + negation | I do not eat. |
| T9 | 4 | + Progressive | (none — structural; forces `be`) | + progressive | I am eating. |
| T10 | 5 (A2+) | + Perfect | (none — structural; forces `have`) | + perfect | I have eaten. |

**Atoms not yet introduced anywhere in T1–T10:** `interrogative`, `numeral`, `conjunction`, `perfect_auxiliary` (wired only via forceWords), `progressive_auxiliary` (same).

**Atoms list authoritative source:** [src/grammarAtoms.en.js](../src/grammarAtoms.en.js) — 19 atoms total. The "17-atom list" referenced in audit notes likely excluded the two auxiliary-aspect atoms (perfect/progressive) which are alternateAtoms-only.

**Existing slot definitions:** [src/sentenceStructure.en.js](../src/sentenceStructure.en.js) — defines SUBJECT_PHRASE and PREDICATE_PHRASE with slot order: `modal → perfect → progressive → negation → verb → object/complement → adverbial`.

---

## Part 2 — Major gaps

These are the things that block the validator from working honestly on real A1 chat. Each section: what's missing, why it matters, options for fixing.

### Gap 1 — Questions absent entirely

**What's missing:** No tier produces a question. `interrogative` exists as an atom but appears in zero tiers. Yes/no questions ("Do you want food?") and wh-questions ("Where is it?", "What is this?") are unrepresented.

**Why it matters:** Two A1 speakers chatting will ask a question within the first minute. Without question support, the validator either rejects every question (broken UX) or rubber-stamps them via word-level checks alone (broken validation). Biggest single gap.

**Options:**
- **A. Dedicated interrogative tier** — own tier introducing `interrogative` atom plus question structures (yes/no via subject-aux inversion, wh-fronting). Could sit between current T8 (negation/aux) and T9 (progressive) since yes/no questions need auxiliary first.
- **B. Distribute across existing tiers** — yes/no questions enabled when `auxiliary` atom unlocks (T8); wh-questions enabled when `interrogative` unlocks (could pair with T8 or earlier).
- **C. Treat questions as structural variants of every applicable tier** — every tier from T1 onwards has a "question form" that's licensed when interrogative is active. More flexible, more bookkeeping.

**My read:** The pattern-based architecture makes B or C natural. Question structures are micro-patterns (sentence starts with auxiliary; sentence starts with interrogative; sentence ends with `?`). Once interrogative atom is unlocked at the right tier, the patterns light up. No need to enumerate "valid question shapes." But the *atom unlock point* still has to be decided — option A puts it earlier and standalone, B couples it to aux unlocking.

### Gap 2 — Prepositions break the adverbial slot

**What's missing:** T6 unlocks `preposition` as an atom and adds the adverbial slot. [sentenceStructure.en.js:111](../src/sentenceStructure.en.js#L111) lets adverbial accept `['adverb', 'preposition']` — but a preposition is not a complete adverbial. "I eat in." passes validation but is broken.

**Why it matters:** Prepositions are not standalone in English. They head prepositional phrases (PP) of the form `preposition + (determiner) + (adjective) + noun` ("in the park", "at school", "to the store"). Without modeling the PP as a unit, the validator either rejects all preposition use (kills "I eat at school") or accepts broken sentences.

**Options:**
- **A. PP as unit** — recognize "preposition + nominal" as an atomic chunk that fills the adverbial slot. Bottom-up trigram pattern: `(preposition, determiner?, noun)` → fires "PP". Adverbial slot accepts `adverb | PP`, not raw preposition.
- **B. Preposition gets own slot with required complement** — preposition slot pulls a nominal slot after it. More structural but tighter binding.
- **C. Defer preposition to A2** — strip preposition out of A1 entirely. Avoids the problem at the cost of "I go to school"-class sentences. Probably too restrictive.

**My read:** A is the most natural fit for the pattern-based architecture. A PP is exactly the kind of trigram the validator detects — and its presence is licensed when preposition + noun are both unlocked. No new slot needed; the adverbial slot just accepts the PP pattern.

### Gap 3 — No imperatives, no conjunctions, no vocatives

**What's missing:**
- **Imperatives** — "Help me." "Sit down." Every current tier requires a subject. Imperatives have no representation.
- **Conjunctions** — `conjunction` is an atom with no tier. "I eat and you sleep." has no path.
- **Vocatives** — "Friend, come here." Standalone address before a sentence.

**Why it matters:** All three are common at A1 chat. Imperatives in particular are how requests, instructions, and basic commands work — saying "please give me water" requires the imperative form.

**Options for imperatives:**
- **A. Subject-optional structural variant** — every tier has a "subject omitted" form. Imperative pattern: sentence starts with bare lexical_verb. Licensed at T1 (or wherever an "imperative" toggle lives).
- **B. Dedicated imperative tier** — explicit tier introducing imperatives. Sequencing question: before or after T2?

**Options for conjunctions:**
- **A. Conjunction tier** — own tier, probably band 3 alongside adverbial. Licenses bigrams `(noun, conjunction, noun)`, `(clause, conjunction, clause)`.
- **B. Coordinate later** — A1 might be too early for conjunction-joined clauses. Could ship conjunction-joining-words ("apples and oranges") at A1 but defer clause coordination to A2.

**Options for vocatives:**
- **A. Vocative pattern** — `(noun-or-name, comma, sentence)`. Cheap to detect, licensed when basic clause is licensed.
- **B. Defer** — vocatives are stylistic, not structural. May not need first-class A1 support.

**My read:** Imperatives are essential and the subject-optional pattern is clean. Conjunctions for noun-joining are easy A1; clause-joining can defer. Vocatives can defer.

### Gap 4 — Modal cannot combine with copula

**What's missing:** [constructorTiers.en.js:44](../src/constructorTiers.en.js#L44) — T7's verb slot accepts `lexical_verb` only. So "I can be happy", "She will be tired" fail validation even though copula and modal are both unlocked.

**Why it matters:** "I can be happy" and "she will be tired" are normal A1. The block is incidental — a side-effect of T7's slot configuration not knowing about T3's copula.

**Options:**
- **A. Lift the restriction** — T7's verb slot accepts `lexical_verb | copula`. The cumulative atom set determines what's actually licensed.
- **B. Modal+copula trigram pattern** — pattern `(modal_auxiliary, copula, complement)` fires and is licensed when both atoms are active. Lives outside the slot system. Cleaner under the new architecture.

**My read:** B. Under the pattern model, the slot table doesn't need to enumerate every legal verb-slot filler. The trigram pattern fires; the licenser checks if both atoms are active; pass.

### Gap 5 — Bare-plural noun subjects blocked

**What's missing:** T1–T3 force `subject_noun: { accepts: ['personal_pronoun'] }`. So "Dogs run." is invalid until T4 (determiner). "Bare plurals" (no determiner) are blocked.

**Why it matters:** Bare plurals are A1 — "Dogs bark." "Cats sleep." "People eat." Defensible as a pedagogical scaffold (force determiner practice) but a real exclusion.

**Options:**
- **A. Allow bare-plural noun subject from T2** (when noun atom unlocks) — pattern `(plural-noun, verb)` is licensed without determiner.
- **B. Keep T4-gated** — pedagogical decision; bare plurals introduced when determiner is also available, scaffolding both at once.
- **C. Allow at T1 alongside pronouns** — most permissive. Risk: users skip determiner practice.

**My read:** This is a pedagogical call, not a correctness call. If the goal is structural-correctness validation, allow B's restriction to be a *pattern toggle*: "bare-plural-subject blocked" is one rule among many, on by default, that you can turn off later if it feels too restrictive.

### Gap 6 — `auxiliary` atom is overloaded

**What's missing:** [grammarAtoms.en.js:53](../src/grammarAtoms.en.js#L53) — `auxiliary` covers do-support (do/does/did). But the perfect aux (`have`) and progressive aux (`be`) have their own atoms (`perfect_auxiliary`, `progressive_auxiliary`) — used only as alternateAtoms, never as primary. T8 unlocks `auxiliary`; T9 forces `be`; T10 forces `have`.

**Why it matters:** The atom name suggests it covers all auxiliaries but it doesn't. Naming feels misleading. For validation, "auxiliary unlocked" doesn't tell you which auxiliary behaviors are licensed.

**Options:**
- **A. Rename `auxiliary` to `do_support_auxiliary`** — clearer scope.
- **B. Three separate atoms with clearer naming** — `do_aux`, `have_aux`, `be_aux`. They unlock independently.
- **C. Leave naming alone, document carefully** — atom IDs are stable; renames have cascading effects.

**My read:** A or B if you're already redesigning. Otherwise C and document. The validator doesn't care about the *name*, only what's in the licensed-atoms set. But the *patterns* that fire need to map to the right atom IDs — clearer names reduce wiring bugs.

---

## Part 3 — Minor inconsistencies

These are low-impact and may resolve naturally during the redesign.

### `object_pronoun` may not be a real atom

[constructorTiers.en.js:17](../src/constructorTiers.en.js#L17) lists `object_pronoun` in T2's atoms. [sentenceStructure.en.js:104](../src/sentenceStructure.en.js#L104) accepts it in the object slot. But [grammarAtoms.en.js:25](../src/grammarAtoms.en.js#L25) says `object_pronoun` exists as an atom — *however*, `you` and `it` are classified as `personal_pronoun` (note in atom desc) and reach the object slot via alternateAtoms at A2+. So `object_pronoun` is real for me/him/her/us/them, but cross-tier wiring is fragile.

**My read:** Let object slot's `accepts` list be `['noun', 'object_pronoun', 'personal_pronoun']` so both classes can fill it cleanly. Alternatively, collapse object_pronoun into personal_pronoun and use slot context to disambiguate case (which the design note in [grammarAtoms.en.js:113](../src/grammarAtoms.en.js#L113) flags as an open question for possessives too).

### Interjection in T2 contradicts deferred status

[constructorTiers.en.js:18](../src/constructorTiers.en.js#L18) embeds `interjection` as optional in T2. The architecture memo says interjection is deferred ([grammarAtoms.en.js:159](../src/grammarAtoms.en.js#L159) describes it as not filling a grammatical slot). Pick one — either interjection is a live A1 feature with its own tier or pattern, or it's removed from T2.

**My read:** Standalone interjections ("Yes." "Hello." "Okay.") are very A1 — they should be supported. But not as an embedded T2 slot — as a standalone "single-word interjection" sentence pattern. Move to its own pattern, drop from T2.

### Forms-map needs form-type tagging (already discussed)

Validator depends on knowing whether a surface form is `past` / `3sg` / `past_participle` / `present_participle` / `plural` / `base`. This is being addressed today as part of the architecture work.

---

## Part 4 — The architecture shift (for context)

**Old model (implicit in current tier files):** tiers are templates. Sentences are validated against tier slot configurations.

**New model:** tiers are *bundles of pattern licenses*. The unit of validation is the **pattern**, not the sentence. Tiers introduce atoms; atoms unlock patterns. The validator:

1. Tokenizes the sentence
2. Detects every micro-pattern that fires (morphology, atom n-grams, boundary patterns)
3. For each fired pattern, looks up its license — `forbidden` / `requires_atoms: [...]` / `requires_form_type: [...]`
4. Sentence is allowed iff every fired pattern is licensed under the learner's active atoms

**Why this matters for the tier redesign:** under the new model, you don't have to enumerate "every valid A1 sentence shape." You have to:

- Decide which atoms unlock at which tier (atom progression)
- Decide which patterns are forbidden at A1 (level-independent blacklist: `-ed` past, `-ing` progressive until T9, `-er`/`-est` comparative, possessive `'s`, etc.)
- Decide which patterns are licensed when (a function of which atoms are active)

The "what's a valid sentence" question dissolves. You only ever deal with: which atoms, which patterns.

This means most of the gap-fixing decisions above stop being "redesign the tier slot config" and become "add a pattern + license + toggle." The architecture absorbs them.

---

## Part 5 — Suggested order for redesign (not today)

When you sit down to redesign:

1. **Decide the A1 atom progression** — which atoms unlock at which tier. Probably small adjustments to current order, plus adding `interrogative` and `conjunction` somewhere.
2. **Enumerate the A1 pattern library** — for each atom (or atom pair), what patterns become licensed when it unlocks? Build the list bottom-up from common A1 sentences.
3. **Enumerate the A1 forbidden patterns** — what's never allowed at A1, regardless of atom set? Past tense, progressive aspect (until T9), comparatives, perfect aspect, possessive `'s`, infinitive `to + V`, relative clauses.
4. **Decide pedagogical toggles** — bare-plural subject? imperatives at T1? interjection-only sentences? Each is a switch.
5. **Wire each pattern into the registry** with `{ id, type, detector, license, group }`.

The validator doesn't need to be redesigned for any of this. The pattern *library* gets filled in.
