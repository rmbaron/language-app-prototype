# Macro Layer Sketch — Working Document

Status: design sketch. No code yet. Started 2026-05-01 (session 43).

## North star — forward momentum

A macro shape is the right primitive only if it carries the sentence forward. It must:

1. Be **detectable from what's already been typed** (left-to-right, no looking ahead)
2. **Constrain what can come next** (announces what slot/structure is wanted)
3. **Compose naturally** with the next macro shape in line

This is a *functional* test, not just an *economy* test. It rules out anything that requires looking at the whole sentence in retrospect to identify it. A primitive that only makes sense after the sentence is complete is the wrong primitive — you've reached for the wrong layer of abstraction.

The principle has linguistic backing: it aligns with **incremental processing** in psycholinguistics (humans parse word-by-word, committing as they go) and with **Dynamic Syntax** (Kempson, Meyer-Viol, Gabbay 2001) — a framework that makes the incremental procedure constitutive of grammatical knowledge, not separate from it.

**Test for any new primitive: does it pass the forward-momentum check?** If not, it's at the wrong layer.

## The architecture as a forward-flowing pipeline

The architecture is not a tree of static layers. It is a forward-flowing pipeline where each layer announces itself and constrains what comes next.

| Layer | What it announces | What it constrains next |
|---|---|---|
| Atoms | Word-level type | What patterns can fire |
| Patterns | Sub-sentence shape (NP, VP, AdvP) | What slot is being filled |
| Slot roles | Which slot was just filled | What slot the verb wants next |
| Verb argument structure | What slots the clause requires | The remaining trajectory |
| TAM markers | Tense/aspect/modality/voice/polarity decoration | Verb form that follows |
| Operations | What surface variant is being produced | Where the canonical resumes |
| Marked constructions | A specific stored shape | The shape's internal trajectory |

Each layer is a forward-momentum mechanism operating at a different scale.

## The 5 slot roles — the macro primitives

1. **Subject (S)** — the thing the clause is about
2. **Verb (V)** — the predicate's head
3. **Object (O)** — what the verb acts on. Polymorphic: can fire twice (direct + indirect)
4. **Complement (C)** — predicates a property over S or O. Polymorphic: subject complement vs. object complement, distinguished by attachment
5. **Adverbial (A)** — locates/modifies the action. Optional or obligatory depending on the verb

That's the entire macro-shape catalogue. Function distinctions (Od/Oi, Cs/Co) live in the verb's argument-structure declaration, not in the role list.

## Verb argument structure — the central engine

Every verb atom declares its argument structure: which slot patterns it permits. This is **truth**, not design — it's an intrinsic linguistic property of the verb.

Examples:
- `run`: `[S+V]` (intransitive) or `[S+V+A]` (with motion adverbial — "I run to school")
- `eat`: `[S+V]` or `[S+V+O]`
- `give`: `[S+V+IO+DO]` or `[S+V+O+A]` (dative shift to PP)
- `live`: `[S+V+A]` (A is obligatory — "He lives" is ungrammatical)
- `put`: `[S+V+O+A]` (A is obligatory — "She put the book" is ungrammatical)
- `paint`: `[S+V+O]` or `[S+V+O+C]` (resultative)
- `be`: `[S+V+C]` (copular — C can be AdjP/NP/PP)

The "canonical" of any sentence is just the slot-list its verb permits. No need to enumerate canonicals at the schema level. Verbs declare; clauses follow.

## TAM layer — 5 dimensions

The TAM (tense/aspect/modality) layer sits between slot composition and operations. It decorates the predicate without changing the slot composition.

- **Tense**: present / past
- **Aspect**: simple / progressive (BE+ing) / perfect (HAVE+en) / perfect-progressive
- **Modality**: can / could / will / would / shall / should / may / might / must / ought
- **Voice**: active / passive (BE+en + by-PP)
- **Polarity**: positive / negative (NOT after aux/modal/copula; do-support for present/past simple lexical verbs)

These are compositional, not factorial — about 100–200 surface combinations realized by ~25 atomic ingredients.

The canonical (slot composition) is identified after TAM is stripped from the predicate. *"I am eating"* is SV with progressive aspect; the underlying canonical is just `[S+V]`.

## Operations layer — sentence-level transformations

Operations apply *after* slot composition + TAM. Each is announced by its leftmost element (with the multi-hypothesis caveat below).

1. **subject_elision** → imperative. *"Eat the food."* (Strips S from canonical.)
2. **subject_aux_inversion** → yes/no question. *"Does she eat the food?"* (Fronts auxiliary; do-support if no auxiliary present.)
3. **wh_fronting** → wh-question. Parameterized by which slot the wh-word came from (subject wh: no inversion; object/adverbial/complement wh: + inversion).
4. **adverbial_fronting** → topicalized declarative. *"Yesterday, she ate."*
5. **negative_inversion** → fronted negative + subject-aux inversion. *"Never has she eaten this."*
6. **quotative_inversion** → quote + verb + subject. *"'Yum,' said she."*
7. **dummy_insertion** → existentials and clefts. *"There is food." / "It was food that she ate."*

Operations carry their own grammar (e.g., yes/no inversion of present-tense lexical verbs requires do-support).

## Slot-filler typing

Slots aren't only filled by NPs. They're filled by typed fillers, and verbs declare per-slot accepted filler types:

- NP (most common)
- Pronoun
- Gerund (*"I enjoy swimming"*)
- Infinitive (*"I want to swim"*)
- Wh-clause (*"I know what she means"*)
- That-clause (*"I think (that) she is happy"*)
- Bare infinitive (*"I made him cry"*)

E.g. `think.O.fillers = [NP, that_clause]` but `want.O.fillers = [NP, infinitive]` — *"I think to eat"* is bad and *"I want that she eats"* is bad because verbs are picky about complement type.

## Marked construction registry

A small, grows-with-need registry of shapes that genuinely don't reduce to slot-composition. These are stored as units alongside the compositional engine.

Initial entries:
- **Existentials**: `there + BE + NP + (locative)` — *"There is a problem (in the kitchen)."*
- **Weather verbs**: zero-valent verbs that English forces dummy "it" onto — *"It is raining."*
- **Idioms-with-syntax** (added as encountered): *"What's X doing Y?"*, *"the more X the more Y"*, *"How dare you?"*, etc.

The registry doesn't enumerate constructions upfront. It grows as real learner content surfaces shapes that the compositional engine can't handle.

## Refinements to the principle

Three places where the strict version of forward momentum is too strong, and the architecture has to accommodate:

### Multi-hypothesis at the left edge
The leftmost element doesn't always deterministically announce a single trajectory. Several first-words are ambiguous:
- "Did" → question OR emphatic declarative
- "What" → wh-question OR exclamative
- "There" → existential OR locative adverb
- "It" → dummy OR referential
- Bare verb → imperative OR subjunctive

The architecture has to hold parallel candidate trajectories at the left edge, narrowing them as subsequent words arrive. Dispatch is a multi-hypothesis announcement, not a deterministic switch.

### Bounded backtrack budget
Garden path sentences (*"The horse raced past the barn fell"*) prove pure no-backtrack is too strong. Humans backtrack a few words when their commitment fails. The architecture needs a small bounded undo stack — not unlimited backtracking, but enough to recover from short-range commitment errors.

### Late binding
*"Apples, I love."* — the role of "Apples" can only be confirmed once the predicate is seen. Some bindings are deferred. The architecture has to allow slot-roles to be assigned later than the moment of slot-filling for fronted elements.

## Open architectural questions

Specifying these is the next layer of design work — not blockers, but real decisions:

A. **When is a clause "complete"?** Forward momentum says what's wanted next, but verbs have mandatory slots (determine completeness) and optional adjuncts (can attach indefinitely). Need explicit two-state: *complete* vs. *open for adjuncts*.

B. **TAM-operation composition.** TAM and operations interact non-trivially (passive + question = *"Was the food eaten by her?"*). Operation has to know the TAM stack. Most natural: TAM resolves within the predicate first, then operations apply to TAM-decorated predicate.

C. **Compositional vs. marked-construction dispatch.** Try registry first (left-edge fingerprint match) and fall back to compositional? Or compositional first, registry as fallback when compositional fails? Runtime dispatch question.

## Boundaries — when to stop consolidating

The factorial-collapse heuristic is the right tool *until* it isn't. Stop consolidating when:

1. **Adding another consolidation layer produces more code complexity than entries-saved benefit.** ("We collapsed 3 things into 1, but now the 1 has 5 if-branches inside it.") That's smuggling the factorial into runtime, not eliminating it.
2. **The remaining items genuinely can't be derived.** True idioms, grammatical exceptions, register-bound phrases. Store them as units.
3. **The compositional engine starts producing garbage** that would need post-hoc filters anyway. (Like a rule system that lets you say *"I runs"* and then has to filter via agreement rules. The agreement rule might as well be its own constraint.)

Pure consolidation has been tried (Chomsky 1957 onward, generative grammar). After 60 years of work, no one has produced a complete generator for any natural language. The long tail consistently breaks the compositional engine. The hybrid sweet-spot — small compositional core + small marked-construction registry — is what works empirically.

## What this displaces / how it integrates

- **Composites layer (current pipeline):** most current composites become *derivable* from slot composition + TAM + operations. The 6-8 retire-able composites flagged in session 42's letter are pure combinations and should retire. Composites that survive should be shapes that can't be derived — those become marked constructions.
- **Couplings layer:** couplings remain useful as the "patterns that fired together" runtime grouping, but shouldn't be authored as static records. They should *emerge* from slot-composition + operation combinations at runtime.
- **Patterns layer:** unchanged. Still the slot-and-constraint detector for sub-sentence structures.
- **Atoms layer:** structure unchanged, but **gains real consumer pressure** — verbs need argument-structure declarations; words need filler-type information. The macro layer reads atoms when filling slots. Consumer pressure will sort truth from design at the atom level.

## Why this matters for the chat use case

The forward-momentum architecture is exactly what enables real-time structural feedback in peer chat. As a user types, the system can:

- Know which slots have been filled and which are still pending (from the verb's argument structure)
- Detect when a forming sentence is heading toward a shape the interlocutor doesn't have in their bank
- Surface this *before* the sentence is sent, not after

A grammar engine designed around static rules and complete-sentence parsing can't do this cleanly. Yours can — because the architecture *is* the incremental procedure.

## Next steps

In rough order of foundation-laying:

1. **Slot-roles registry** — create the 5 slot roles as first-class entries in the codebase, surfaced on the Flow tab. Tiny, foundational.
2. **Verb argument structure on a handful of verbs** — pick 5-6 verbs spanning the slot patterns (intransitive, transitive, ditransitive, copular, SVA, SVOC). Add `argumentStructure` field at the right layer (word records, not atom records — these are per-instance facts). Surface on Flow tab.
3. **TAM layer skeleton** — create the 5 TAM dimensions as first-class entries. Don't wire to validation yet.
4. **Marked constructions registry skeleton** — create the registry with the 2-3 starting entries (existentials, weather verbs). Don't wire to validation yet.
5. **Composites audit and retirement** — identify which composites are pure combinations and retire them.
6. **Multi-hypothesis dispatch design** — specify how the architecture holds parallel candidate trajectories at the left edge. Architecture decision before code.

Don't try to build the whole pipeline at once. Each step is a commit; each commit has visibility on the Flow tab; each commit is a foundation for the next.
