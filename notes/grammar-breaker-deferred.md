# Grammar Breaker — Deferred Work

Items identified during build but intentionally not tackled yet. Each entry: what it is, why it was deferred, what's needed when picking it up.

Compiled 2026-04-30. Update as items are addressed or new ones surface.

---

## Status snapshot — done since first compiled

- ✅ **6a, 6b, 6c** — three correctness bugs all fixed (count/mass/proper splits, bare-noun subjects, pattern-record validation at module load)
- ✅ **Token coverage check** — added to validator; replaces dangling-NP band-aid
- ✅ **Determiner atom split** — added `indefinite_article`, `definite_article`, `quantifier_determiner` + `determiner` umbrella; `indefinite_article_with_plural_noun`, `_mass_noun`, `_proper_noun` patterns
- ✅ **Atom wiring sanity check** — `src/atomWiring.js` runs at app load; reports any forgotten wiring
- ✅ **New-atom runbook** — `notes/new-atom-runbook.md` documents the steps for future atom additions
- ✅ Several Item 8 patterns — adverb position, possessive pronoun complement, conjunctions split, infinitive marker, indefinite/reflexive pronouns
- ✅ Item 8's atom additions: pronoun umbrella, conjunction umbrella, possessive_pronoun, reflexive_pronoun, indefinite_pronoun, relative_pronoun, reciprocal_pronoun, coordinating/subordinating_conjunction, infinitive_marker

Items still open are listed below.

---

## 1. License model — OR-of-atoms support

**What:** The current license is `{ requiresAtoms: [...] }` (all-of) or `{ alwaysForbidden: true }`. There's no way to express "any-of." This forces pattern duplication: `verb_object_noun` + `verb_object_pronoun` for "verb takes a noun OR object pronoun"; three separate patterns for `(determiner|demonstrative|possessive_determiner) + noun`.

**Options weighed:**
- **A (recommended):** Add `requiresAtomsAny: [...]` alongside `requiresAtoms`. AND-of-any. Covers ~95% of duplication cases. Stays declarative.
- **B:** License as a function — maximum flexibility, but every pattern becomes custom code, breaks "patterns are pure data."
- **C:** Tiny DSL (`{ all, any, none, if }`) — over-engineering for the cases we have.
- **D:** Keep duplication — clearer per-pattern error messages, but more patterns to maintain.

**Why deferred:** Patterns work correctly even duplicated. The mess is verbosity, not correctness.

**When to revisit:** When the duplication count crosses some pain threshold OR when we hit a case A doesn't cover.

**Adjacent:** If we add umbrella atoms (e.g., `pronoun` over case-specific pronoun atoms; `nominal` over noun+proper+indefinite), some OR cases dissolve into single-atom checks. That route may reduce demand for OR-licenses.

---

## 2. Polysemy — constraint-solving over atom interpretations

**What:** A token can carry multiple atoms (e.g., `be` is `copula` primary + `progressive_auxiliary` + `auxiliary` alternates). The validator's "any-atom matches" semantics fires every interpretation. For lexical words tagged with multiple classes (theoretical: `run` as verb + noun, `light` as verb + noun + adjective), this would produce noise.

**Why deferred:** In practice almost no lexical words in the current registry carry multiple atoms. Closed-class polysemy (be, have, do) is principled and works correctly. The concern is theoretical for current data.

**When to revisit:** When we expand the registry to multi-tag noun-verb pairs, OR when concrete false-positive cases appear during testing.

**Adjacent:** Connects directly to item (4) — same constraint-solving mechanism handles both atom polysemy and form-type polysemy.

---

## 3. Multi-word units — connect grammar breaker to tokenizeFull + dual-axis tagging

**What:** The existing word-level breaker has `FIXED_UNITS` ("would you like", "I'd like", etc.) and `tokenizeFull` that recognizes constructions (modal, progressive, perfect). The grammar breaker currently uses simpler tokenization and doesn't see multi-word units. So natural A1 chunks get tokenized into pieces and don't fire patterns the way they should.

**Architectural recommendation — dual-axis tagging for multi-word units:**

Single chunk carries labels on two independent axes:

**Axis 1 — structural type:**
- `fixed_phrase` — opaque, learned whole ("how are you", "nice to meet you", "thank you")
- `modal_phrase` — modal-fronted constructions acting as fixed stems ("would you like", "could you please", "may I")
- `aspect_construction` — be+V-ing, have+V-ed, going to+V (already handled by `tokenizeFull`)
- `phrasal_verb` — verb + particle ("look up", "give back", "turn on") — major A1 category, currently absent

**Axis 2 — pragmatic function:**
- `politeness` — softens a request/offer
- `greeting` — opens or closes a conversation
- `discourse_marker` — manages flow ("you know", "I mean", "well")
- `question_stem` — fixed sentence-starters
- `routine` — habitual social formula

Examples:
- "would you like" → `modal_phrase` + `politeness` + `question_stem`
- "how are you" → `fixed_phrase` + `greeting` + `question_stem` + `routine`
- "look up" → `phrasal_verb` (no pragmatic role)

**Why dual-axis:** A single chunk can match by either dimension. The grammar breaker primarily uses the structural axis; the pragmatic axis serves content generation, Friend dialogue, and lane curation.

**Why deferred:** The multi-word enrichment panel is set up but hasn't been used. Need it populated before we can wire the grammar breaker through it.

**When to revisit:** After multi-word enrichment campaign produces a populated unit table. Then change the grammar breaker's `rawTokenize` to be multi-word aware (compose with `tokenizeFull` or its successor).

---

## 4. Form-type ambiguity (`read` / `run`) — constraint-solving over form interpretations

**What:** Some surface forms fill multiple roles for the same word.
- `read` → formType `['base', 'past', 'past_participle']`. "I read" might mean base or past.
- `run` → formType `['base', 'past_participle']`. "I run" or "have run."
- `had`, `made`, `said`, `told` → formType `['past', 'past_participle']`. Less ambiguous because they're never the base.

**Current behavior:** `past_simple_morphology` fires on any token with `'past'` in formType, including those that ALSO have `'base'`. So "I read" gets flagged as past tense even when the base interpretation is grammatical.

**Fix:** Validator does a pass over each token's possible form-type set, picks the assignment that minimizes failures. Small constraint problem (each token independent, sentences short). Doable, not free.

**Why deferred:** Not yet bitten in real testing — these specific words haven't tripped users. But it WILL bite once probing increases.

**When to revisit:** After basic A1 pattern coverage is solid. Same constraint-solving mechanism handles atom polysemy too (item 2).

---

## 5. Macro patterns — `sentence_shape` type

**What:** Whole-sentence rules — properties that depend on scanning the entire token list, not local sequences. Examples:

- "Every sentence must have a subject" — fires forbidden if no token has subject-eligible atom in subject position.
- "Imperatives have no subject" — fires allowed if sentence starts with bare verb AND no preceding subject-eligible token.
- "Sentence has at least one verb" — sanity check.
- "Single-word sentence is interjection-only" — gates "Hello." / "Yes." / "No." against interjection atom.
- "Sentence ends with appropriate terminator" — period, ?, !.

**Why deferred:** I scaffolded the `sentence_shape` type in PATTERN_TYPES but didn't seed any patterns. Macro rules need to wait until imperatives, subject-required-checks, and similar tier-level constructs come up.

**When to revisit:** When tier redesign brings imperatives or other whole-sentence-shape decisions to the foreground.

**Implementation note:** Detector signature is the same — takes tokens, returns matches. The match span typically covers the whole sentence. Different in practice from bigram/trigram only in scan logic.

---

## 6. Three correctness bugs

### 6a. Trigram silent determiner absorption

**Bug:** `verb_object_noun` and `copula_noun` are trigrams that match `(verb, [det], noun)` and `(copula, [det], noun)` respectively, but their licenses only require the verb/copula and the noun — not the determiner. So "I want the food" passes verb_object_noun even with `determiner` not in active atoms.

**Status:** Superseded by the count/mass/proper schema work. Once the new noun classification is in, these patterns get split (e.g., into `copula_proper_noun`, `copula_mass_noun`, `copula_plural_noun`, `copula_determined_noun`, `copula_bare_singular_count_noun`-forbidden). Each replacement has clean, specific licensing — no silent absorption.

### 6b. Bare-noun subjects don't fire SVO

**Bug:** "Dogs run" has no pattern that covers it because every subject pattern assumes `personal_pronoun`. A1 absolutely uses bare plural subjects, mass-noun subjects, and proper-noun subjects.

**Status:** Same family as 6a. Once count/mass/proper schema is in, add subject-side patterns: `noun_verb_plural`, `noun_verb_mass`, `noun_verb_proper`, `det_noun_verb`, plus forbidden `bare_singular_count_noun_verb`. Roughly 8 new patterns total.

### 6c. No null-checks against malformed pattern records

**Bug:** Validator wraps detectors in try/catch but doesn't validate pattern records on load. A pattern with a missing `detector`, `id`, `group`, `license`, or `type` field would fail silently (or throw at first use).

**Fix (cheap):**
```js
function validatePattern(p) {
  if (!p.id)      throw new Error(`pattern missing id: ${JSON.stringify(p)}`)
  if (!p.group)   throw new Error(`pattern ${p.id} missing group`)
  if (typeof p.detector !== 'function') throw new Error(`pattern ${p.id} missing detector function`)
  if (!p.license) throw new Error(`pattern ${p.id} missing license`)
  if (!p.type)    throw new Error(`pattern ${p.id} missing type`)
}
PATTERNS.forEach(validatePattern)
```

Run at module load. Loud failure at startup beats silent breakage at runtime.

**Status:** Easy to add. Should ship as part of any next pattern-library change.

---

## 7. Tier preset for active atoms (UX, not architecture)

**What:** The active-atoms picker on Build/Validate tabs is manual — you toggle each atom checkbox individually to simulate a tier. There's no "set active atoms to T3 cumulative" button.

**Why deferred:** UI convenience, not correctness. The architecture supports any active-atom configuration. This is just adding a tier-preset dropdown that maps tier IDs to cumulative atom sets.

**When to revisit:** After the tier redesign. Wire the new tiers' atom unlock lists to a preset dropdown in the Grammar Breaker dev panel.

---

## 8. Pattern work pending for newly-defined atoms and L2 fields

The following atoms / L2 fields will be defined and populated during the upcoming consolidated enrichment pass, but the **patterns that consume them** are deferred until the relevant tier work surfaces. Each item below: what was added at the data layer, what pattern work it unlocks, and when to write those patterns.

### New atoms — patterns pending

- **`pronoun` (umbrella)** — every pronoun's alternateAtom. Patterns that want to fire on "any pronoun-shaped thing" without caring about case will use this. Write when cross-cutting pronoun rules surface (e.g., "no two pronouns adjacent without conjunction").

- **`possessive_pronoun`** (mine, yours, hers, ours, theirs, his-as-pronoun) — fills standalone-NP / complement slot. Patterns: `copula_possessive_pronoun` ("This is mine"), possessive in object position. Write when A1.2 tier work brings standalone possessives.

- **`reflexive_pronoun`** (myself, yourself, himself, herself, itself, ourselves, yourselves, themselves) — fills object slot when coreferent with subject. Patterns: subject + verb + reflexive_pronoun, with optional agreement check (subject's person/number/gender = reflexive's). Write when A2 tier work brings reflexives.

- **`indefinite_pronoun`** (someone, anyone, no one, everyone, something, anything, nothing, everything, plus quantifier-pronouns like "some" / "any" / "none" used pronominally) — fills subject or object slot. Patterns: standard SVO with indefinite pronoun in subject/object. Write when tier work brings indefinites.

- **`relative_pronoun`** (who, whom, which, that-as-relative, whose) — introduces relative clause. Patterns: relative-clause structures ("the man who lives here"). B1+ work; defer.

- **`reciprocal_pronoun`** (each other, one another) — fills object slot for mutual relationships. Patterns: subject (plural) + verb + reciprocal. B1+ work; defer.

- **`coordinating_conjunction`** (and, but, or, so, yet, nor) — joins equals. Patterns: noun + cc + noun ("apples and oranges"), clause + cc + clause ("I eat and you sleep"). Write when conjunction tier surfaces.

- **`subordinating_conjunction`** (because, if, when, although, while, though, since-as-conjunction) — introduces dependent clause. Patterns: clause + sc + clause ("I eat because I'm hungry"). B1+ for full clause subordination; defer most. Some A2 cases (because, if, when) come earlier.

- **`conjunction` (umbrella)** — every conjunction's alternateAtom. For cross-cutting "any conjunction" patterns. Write when needed.

- **`infinitive_marker`** — `to` as alternate atom (primary stays preposition). Patterns: verb + infinitive_marker + lexical_verb ("I want to go"). Write when verb+infinitive structures surface in tier work.

### New L2 fields — patterns pending

- **Verb `transitivity`** — patterns:
  - `intransitive_with_object_forbidden` (forbidden) — "I sleep food" gets flagged
  - `transitive_without_object_forbidden` (forbidden in finite contexts) — "I want" alone gets flagged (unless context allows null object)
  - `ditransitive_two_objects` (allowed) — "give him a book"
  - Write soon — these are A1 grammar correctness, immediately useful.

- **Verb `verbAspectClass`** — pattern:
  - `stative_progressive_forbidden` (forbidden) — "I am knowing" gets flagged
  - Write at A2 when progressive aspect tier surfaces.

- **Verb `commonParticles`** — used by multi-word system to identify phrasal verbs. Not a direct pattern source.

- **Adjective `adjectivePosition`** — patterns:
  - `attributive_only_after_copula_forbidden` (forbidden) — "the cat is former" wrong
  - `predicative_only_attributive_forbidden` (forbidden) — "the asleep cat" wrong
  - Write when relevant cases arise; rare at A1.

- **Adverb `adverbType`** — patterns:
  - `time_adverb_position_end` (allowed at end) — "I eat now"
  - `place_adverb_position_end` (allowed at end) — "I eat here"
  - `frequency_adverb_position_pre_verb` (allowed before main verb) — "I always eat"
  - `degree_adverb_position_modifies_adjective` (allowed before adjective) — "very good"
  - Write soon — these are immediate A1/A2 utility.

- **Numeral `numeralType`** — patterns:
  - `cardinal_before_noun` (allowed) — "two cats"
  - `ordinal_with_determiner` (allowed) — "the second cat"
  - Write when numerals matter.

- **Pronoun/noun `person`, `number`, `gender`** — patterns:
  - `subject_verb_agreement_3sg` (forbidden mismatch) — "she run" gets flagged because subject is 3sg but verb form is base instead of third_person_present
  - `reflexive_coreference_match` (forbidden mismatch) — "I see herself" gets flagged
  - Write at A1.2 (subject-verb agreement) and A2 (reflexives).

- **Noun `countability`** — patterns: see items 6a/6b above (replaces broken trigrams). Write as part of fixing those bugs after enrichment.

- **Noun `properNoun`** — patterns: see items 6a/6b above. Same.

- **Noun `concreteness`** — no immediate grammar-validation pattern. Used in content generation later.

### Cross-cutting dual-function words

The enrichment prompt should explicitly handle these. They need careful primary + alternateAtom tagging:

| Word | Primary | Alternate(s) |
|---|---|---|
| `to` | preposition | infinitive_marker |
| `you`, `it` | personal_pronoun | object_pronoun (A2+) |
| `his` | possessive_determiner | possessive_pronoun |
| `her` | object_pronoun | possessive_determiner |
| `that` | demonstrative | relative_pronoun (B1+), subordinating_conjunction |
| `as` | preposition | subordinating_conjunction, adverb |
| `like` | lexical_verb | preposition, subordinating_conjunction |
| `back` | adverb | noun, lexical_verb, adjective |
| `there` | adverb | (existential: "there is...") |
| `one` | numeral | indefinite_pronoun |
| `some`, `any` | determiner | indefinite_pronoun |

When patterns are written for any of these alternate atoms, they'll fire on these words automatically because of alternate-atom membership.

## 9. Lemma family curation — separate layer (L2.5)

**What:** L2 enrichment produces a default `lemmaFamily` per word, but the AI is conservative — each word gets its own family unless the relation is obviously derivational (`happy → happiness → happily`). For pronouns and other closed-class systems, the AI doesn't group `I / me / my / mine / myself` under a shared family even though they share a referent (1st person singular).

**Why deferred:** L2 is per-word. Family grouping is cross-word — a different question that needs a different prompt or a curation UI. L2 producing each word as its own family is *correct given its scope*, just not as useful as it could be.

**Architectural shape:** L2.5 / lemma curation layer. Reads existing L2 records, overrides `lemmaFamily` based on cross-word grouping rules. Could be:
- **Automatic** — a separate AI call that takes a batch of related words and assigns shared family IDs (e.g., "given I, me, my, mine, myself, group these by referent family").
- **Manual** — a curation UI that lets you draw family relationships and writes overrides.
- **Heuristic** — known patterns (all forms of `be` get `lemmaFamily: 'be'`; all 1sg pronouns get `lemmaFamily: 'i'`; etc.).

**When to revisit:** When content-layer features (vocab acquisition flow, lane curation, "you know X, here's its noun form") start needing accurate family grouping. Currently nothing in the validator or pattern library reads `lemmaFamily`, so wrong/over-fragmented values don't cause downstream problems.

**Implementation note:** The override should be persistent and live alongside or downstream of L2. A new layer file (`wordLayerCuration.js` or similar) writing to its own localStorage key, read by `getResolvedWord` after L2.

## 10. Atom metadata consolidation

**What:** Adding an atom currently requires editing 6+ separate files (grammarAtoms, atomToCategory, atomPioneers, atomGroups, the L2 prompt, optionally circuitCheck). Some of these mappings could live as fields on the atom definition itself, reducing the surface area to one file:

```js
{
  id: 'indefinite_article',
  label: 'Indefinite article',
  group: 'Function words',
  description: '...',
  examples: ['a', 'an'],
  // NEW fields:
  class:             'closed',                                 // replaces OPEN_CLASS_ATOMS membership
  category:          'determiner',                             // replaces ATOM_TO_CATEGORY entry
  pedagogicalGroups: ['determiner_class', 'determiner_articles'],  // replaces atomGroups membership
  pioneer:           'a',                                      // replaces ATOM_PIONEERS entry
}
```

**Why deferred:** Refactor work, not bug-fix work. Touches several files. Better to do during a quieter session, not while shipping rules.

**Why we still want it:** Reduces "add atom in 6 places" → "add atom in 1 place." Removes class of forgetting-to-wire bugs entirely (sanity check would still catch them, but the issues wouldn't arise in the first place). When this ships, `notes/new-atom-runbook.md` collapses to a much shorter checklist.

**When to revisit:** Either when adding ~3+ atoms in a session (the current pain becomes worth fixing), or as a deliberate refactor pass during a slow session. The atom-wiring sanity check reduces urgency — it makes the current setup safe even if not minimal.

**Implementation sketch:**
1. Move `OPEN_CLASS_ATOMS` set into a `class` field on each atom definition
2. Move `ATOM_TO_CATEGORY` mapping into a `category` field on each atom
3. Move `ATOM_PIONEERS` map into a `pioneer` field on each atom (null for umbrellas)
4. Move `ATOM_GROUPS` membership into a `pedagogicalGroups` field on each atom (atom-side declaration of which groups it belongs to). The legacy `ATOM_GROUPS` map can be derived by inverting the atom records, kept for consumers that want group→atoms lookups.
5. Update consumers to read fields off resolved atoms instead of the separate maps.
6. Update the sanity check to verify each atom has all fields populated.
7. Update the runbook to collapse to a short checklist.

---

## Picking-up checklist (for future sessions)

When returning to this list:

1. Confirm which items are still relevant (some may dissolve through other work).
2. For each item taken: scope it, then implement. Most are independent of each other.
3. Prefer fixing **6c** (defensive validation) any time another pattern-library change ships — it's a 5-line free win.
4. The count/mass/proper schema work is the prerequisite for **6a + 6b**.
5. Items 2 and 4 share the same constraint-solving mechanism — consider doing them together.
