# Forward Flow — Findings & Gap Log

The Forward Flow tab is the top-down view of the macro layer. As it grows it
also acts as a **discovery surface** — each thing the Forward Flow tab can
detect that the broader app *cannot* is a real architectural gap somewhere
else in the codebase.

This file is the running log. Add entries as gaps surface. Each entry should
name what surfaced it, what's missing, where the fix lives, and whether it's
blocking other work.

## Format

```
### [N] Short title
**Surfaced by:** what test or input revealed it
**What's missing:** the gap in the broader system
**Where the fix goes:** file(s) / layer(s) that need updating
**Priority:** critical / important / can wait
**Notes:** anything else worth remembering
```

---

## Gaps surfaced so far (session 43)

### [1] No `proper_noun` atom in ATOMS
**Surfaced by:** typing *"John"* in Forward Flow.
**What's missing:** The 36 atoms in [src/grammarAtoms.en.js](../src/grammarAtoms.en.js) include `noun` but no `proper_noun`. So even after L1 enrichment, capitalized names get classified as plain `noun` (or stay uncategorized). The Validate / Build / Flow tabs have no way to distinguish *"John"* from *"dog"*.
**How Forward Flow gets around it:** Uses a capitalization heuristic in [src/subjectShapeDetector.js](../src/subjectShapeDetector.js).
**Where the fix goes:** Add `proper_noun` atom record to grammarAtoms.en.js. Update L1 enrichment in wordLayerOne.js (or wherever atom assignment happens) to classify capitalized name-like words into it. May also need to mark proper-noun atom membership in atom groups.
**Priority:** important — proper nouns are common; the gap propagates to multiple surfaces.

### [2] No morphology lookup connecting inflected verb forms to base forms
**Surfaced by:** typing *"I gave him a book"* — Forward Flow doesn't match `give` because *"gave"* isn't `give`'s base form.
**What's missing:** A surface-form → base-form lookup that the macro layer can consult. The codebase has [src/formsMap.js](../src/formsMap.js) and L2 enrichment that enrich verb forms, but no consumer that lets the Forward Flow predictor say *"gave* is a form of *give*."
**How Forward Flow gets around it:** Doesn't. Past tense and other inflected forms simply don't match the verb argument structures yet.
**Where the fix goes:** Wire formsMap.js into the verb-match step in GrammarBreakerForwardFlowTab.jsx. Need an L2-enriched formsMap for the 7 verbs in [src/argumentStructures.en.js](../src/argumentStructures.en.js).
**Priority:** important — most learner sentences will use inflected forms.

### [3] Common adjectives/nouns aren't reliably classified without L1 enrichment
**Surfaced by:** typing *"the happy dog"* before adjectives are L1-enriched — the detector couldn't classify *"happy"* as an adjective.
**What's missing:** L1 enrichment hasn't run for many seed words. Without it, the wordRegistry doesn't return a `grammaticalCategory` and the detector falls back to `null`.
**How Forward Flow gets around it:** [src/subjectShapeDetector.js](../src/subjectShapeDetector.js) hardcodes a small list of common adjectives and nouns as a fallback.
**Where the fix goes:** Run the WordPipeline UI to L1-enrich the seed. Once the registry has categories for these words, the detector's wordRegistry-lookup path will work and the hardcoded fallback can shrink. Long-term: make the L1 enrichment pipeline run automatically on seed additions.
**Priority:** can wait — the hardcoded fallback covers test cases; full coverage will follow naturally as enrichment runs.

### [4] Auxiliary inflections aren't linked to base verbs
**Surfaced by:** building yes/no question detection — needed to recognize *"is"*, *"am"*, *"are"*, *"was"*, *"were"*, *"has"*, *"had"*, *"does"*, *"did"* as exception openers.
**What's missing:** These are inflected forms of `be`, `have`, `do`. The macro layer's exception detection currently lists them as standalone strings in [src/GrammarBreakerForwardFlowTab.jsx](../src/GrammarBreakerForwardFlowTab.jsx) `EXCEPTION_OPENERS.yes_no_question`. Once formsMap is wired (gap #2), this hardcoding can come from the morphology of `be`/`have`/`do`.
**How Forward Flow gets around it:** Hardcoded list.
**Where the fix goes:** Same as #2 — wire formsMap. Then derive the auxiliary set from `be.forms ∪ have.forms ∪ do.forms` instead of listing forms by hand.
**Priority:** can wait — the hardcoded list works; cleanup is structural improvement.

### [5] No `quantifier` atom or category
**Surfaced by:** building Subject shape detection for *"some people"*, *"every child"*, *"all dogs"*.
**What's missing:** Quantifiers (some, every, each, all, no, any, many, few, several, most) aren't in the ATOMS list as a category. The wordRegistry doesn't know they're a closed-class function-word group.
**How Forward Flow gets around it:** Hardcoded in [src/subjectShapeDetector.js](../src/subjectShapeDetector.js).
**Where the fix goes:** Add a `quantifier` atom to grammarAtoms.en.js. Add the closed-class quantifier words to the seed (most are already there) and L1-enrich them with the new atom.
**Priority:** important — quantifier-led NPs are a common Subject shape and the detection currently relies on a fragile hardcoded list.

### [6] No `interjection` / `discourse_marker` atom
**Surfaced by:** building the *Minor sentence / interjection* exception type — *"Hello"*, *"Sorry"*, *"Thanks"*, *"Wow"* at position 0.
**What's missing:** Interjections and discourse markers aren't a recognized category in the atom system. They're not really clause elements at all — they're standalone utterances.
**How Forward Flow gets around it:** Hardcoded set in [src/GrammarBreakerForwardFlowTab.jsx](../src/GrammarBreakerForwardFlowTab.jsx).
**Where the fix goes:** Either add an `interjection` atom (small closed class) OR treat minor sentences as a kind of "marked construction" rather than a clause-level category.
**Priority:** can wait — these are sentence-fragments, not central to the regular clause architecture.

### [7] Article agreement (A/An) not enforced anywhere in the broader system
**Surfaced by:** typing *"a apple"* — Forward Flow now warns about it; nothing else in the app does.
**What's missing:** A general agreement-checking layer that catches *"a apple"*, *"an dog"*, plural agreement (*"the dogs runs"*), tense-aspect agreement, etc. The Validate tab catches some patterns but not these.
**How Forward Flow gets around it:** [src/subjectShapeDetector.js](../src/subjectShapeDetector.js) `checkArticleAgreement` does a simple letter-based check.
**Where the fix goes:** Open question — agreement checking is a layer of its own. Could be a small validation module that the macro layer invokes. The Validate tab would also benefit.
**Priority:** can wait — Forward Flow handles the immediate need; structural agreement is its own piece of work.

### [8] ~~No distinction between bare nouns and other Subject shapes~~ — RESOLVED
**Resolved in session 43:** Added `bare_noun` as the 9th Subject shape ([src/subjectShapes.en.js](../src/subjectShapes.en.js)). Detector handles single-token nouns and adjective+noun without determiner. Surfaced by Chat's review of the shapes-reference doc.

### [9] Subordinate-clause-initial openings not detected
**Surfaced by:** Chat's review of the exception bucket — *"If you go, I'll stay."*, *"When she arrived, we left."*, *"Because he was tired, he slept."*
**What's missing:** Sentences that open with a subordinator (if, when, because, although, since, before, after, while, unless, until). The whole sentence has an embedded clause structure with the subordinate clause fronted. Currently these would route to fundamental lane (because subordinators aren't in any exception opener set) and then fail to match any Subject shape.
**How Forward Flow would handle it:** Add a new exception lane (e.g. `subordinate_fronted`) with a keyword set: `if, when, because, although, since, before, after, while, unless, until`.
**Where the fix goes:** Extend `EXCEPTION_OPENERS` in [src/GrammarBreakerForwardFlowTab.jsx](../src/GrammarBreakerForwardFlowTab.jsx); add new entry to [src/exceptionShapes.en.js](../src/exceptionShapes.en.js).
**Priority:** can wait — B1+ in CEFR terms, out of A1-B1 scope. Architecture supports adding it without restructuring.

### [10] Fronted topic / object not detected
**Surfaced by:** Chat's review — *"This book, I loved."*, *"Coffee, I don't drink."*, *"Apples, she eats every day."*
**What's missing:** Sentences where a non-subject element is fronted to position 0 for topic-marking. The first word looks like a noun-phrase Subject but the comma signals it's actually a fronted topic. Detection requires recognizing "NP followed by comma at sentence start" as a distinct trigger.
**How Forward Flow would handle it:** Add a new exception lane (e.g. `topic_fronted`) detected by NP + comma pattern. More complex than keyword-based dispatch — requires a small state machine for the comma signal.
**Where the fix goes:** Extend `classifyLane` in [src/GrammarBreakerForwardFlowTab.jsx](../src/GrammarBreakerForwardFlowTab.jsx) with comma-pattern detection; new entry to [src/exceptionShapes.en.js](../src/exceptionShapes.en.js).
**Priority:** can wait — uncommon in A1-B1; B1+ register. Architecture supports it.

### [11] Discourse-linker openings not detected
**Surfaced by:** Chat's review — *"And then he left."*, *"But I stayed."*, *"However, she disagreed."*, *"So we left."*
**What's missing:** Sentences that open with a discourse linker (and, but, however, so, therefore, moreover, furthermore, nevertheless). These announce a relationship to the previous discourse, not a particular sentence type. Could be handled as a separate exception lane OR as a "discourse prefix strip" pre-step before dispatch.
**How Forward Flow would handle it:** Two architectural options. (a) Add `discourse_opener` as an exception lane. (b) Add a small pre-step that strips a leading discourse linker, then runs normal dispatch on the remainder ("And then he left" → strip "And", dispatch on "then he left").
**Where the fix goes:** [src/GrammarBreakerForwardFlowTab.jsx](../src/GrammarBreakerForwardFlowTab.jsx) — either new EXCEPTION_OPENERS entry, or a new pre-dispatch step.
**Priority:** can wait — discourse-level, often A2+ in pedagogy. Architecture supports both options.

### [12] Dummy insertion lumps three different constructions together
**Surfaced by:** Chat's review of the catalog. Currently `dummy_insertion` covers *"There is a problem"* (existential there), *"It is raining"* (dummy/expletive it), and *"It was the cat that..."* (cleft it). These are three distinct constructions, not one.
**What's missing:** Internal branching of the dummy insertion category. Right now Phase 3a detects only the *"there"* branch (catalog marks the entry as "partial"). The dummy-it and cleft-it branches need their own detection.
**How Forward Flow would handle it:** Either split into 3 separate exception entries, OR keep as one detection card with internal sub-types. Probably the latter for the dispatch surface — they share the "dummy at position 0 + BE" trigger pattern, just disambiguate at the next-word step.
**Where the fix goes:** [src/GrammarBreakerForwardFlowTab.jsx](../src/GrammarBreakerForwardFlowTab.jsx) (detection logic) and [src/exceptionShapes.en.js](../src/exceptionShapes.en.js) (catalog — note the three branches explicitly).
**Priority:** important — three real constructions are currently being represented as one. Detection accuracy improves when they're separated.

---

## How to use this file

When you're working in Forward Flow and notice something the broader system doesn't handle, add an entry here rather than trying to fix the broader system mid-task. The Forward Flow tab is the discovery mechanism; this file is the punch list. Drain it as work allows.
