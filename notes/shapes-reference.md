# Forward Flow Shapes — Reference

## What this document is — and is not

This is a **forward-dispatch product taxonomy**. It catalogs the shapes a learner-facing tool needs to recognize as a sentence is being typed, word by word. The categories are organized by what's most useful for **routing the system in real time**, not by deep grammatical equivalence.

It is **not a linguistic ontology** of English sentence types. The categories deliberately mix ontological levels — clause types, marked clause operations, discourse objects, and writing-specific constructions all sit alongside each other in the exception bucket. That mixing is intentional: the dispatch question is *"what does the first word announce?"*, and that question doesn't care whether the answer is a clause type or a discourse marker.

If you read this expecting a complete grammatical theory of English openings, you'll find it under-specified and category-mixed. If you read it as a runtime taxonomy for a tool that decides "given this first word, what trajectory is the sentence on?", it does its job.

## What we're building

A live structural analyzer for English sentences. The user types a sentence one word at a time, and the system identifies its **shape** as the sentence is being built — not after it's complete.

The architectural principle is **forward momentum**: every word the user types announces what was just filled and constrains what can come next. The first word in particular is a *dispatch point* — it tells the system which kind of sentence is being built.

Sentences split into two clear buckets at the dispatch point:

- **Core group** — the sentence opens with a Subject. This is the regular declarative.
- **Exception group** — the sentence opens with something else: an auxiliary, a wh-word, a bare verb, a fronted adverb, a quote, an interjection. Each of these announces a different sentence trajectory than the regular declarative.

The macro-layer architecture catalogs the shapes within each bucket. Live detection on a typed sentence figures out which shape (if any) the user is producing, and lights it up.

---

## Core group — 9 Subject shapes

These are the nine ways an English Subject can be shaped. The Subject is whatever sits before the verb in a regular declarative clause.

### 1. Pronoun
A single pronoun in subject case.
- *"**I** run."*
- *"**She** is happy."*
- *"**They** are coming."*

Pronouns: I, you, he, she, we, they, it.

### 2. Proper noun
A name. No determiner needed because the name uniquely identifies its referent.
- *"**John** runs."*
- *"**Mary** is happy."*

### 3. Determiner + noun
A determiner (the, a, an, my, your, this) followed by a common noun (singular or plural).
- *"**The dog** runs."*
- *"**A cat** sleeps."*
- *"**My brother** arrives."*

### 4. Determiner + adjective + noun
A determiner followed by one or more adjectives and a noun.
- *"**The happy dog** runs."*
- *"**The happy dogs** run."*
- *"**A small red car** arrives."*

### 5. Quantifier + noun
A quantifier (some, every, each, all, no, any, many, few) followed by a noun. Adjectives can sit between the quantifier and the noun.
- *"**Some people** are tired."*
- *"**Some happy dogs** barked."*
- *"**Every child** smiles."*
- *"**All dogs** bark."*
- *"**Many small fish** swim."*

### 6. Bare noun
A noun (singular or plural) without any determiner or quantifier. Common with mass nouns and generic plurals. Adjectives can sit before the noun.
- *"**Water** is wet."*
- *"**Dogs** bark."*
- *"**Music** heals."*
- *"**Cold water** refreshes."*
- *"**Tired children** sleep."*

### 7. Coordinated subjects
Two or more subjects joined by "and" or "or".
- *"**John and Mary** arrived."*
- *"**The dog and the cat** slept."*
- *"**Tea or coffee** is fine."*

### 8. Gerund
An *-ing* form of a verb used as a noun.
- *"**Swimming** is fun."*
- *"**Reading** helps."*

### 9. Infinitive
A *to* + bare-verb form used as a noun. Less common as a Subject in everyday speech; more common in formal writing.
- *"**To err** is human."*
- *"**To leave** is to surrender."*

---

## Exception group — 8 marked sentence openings

These are sentences that don't open with a Subject. Each one is announced by a specific kind of element at position 0 — the first word.

### 1. Imperative
A command or instruction. The Subject *"you"* is elided. The verb appears at position 0 in its base form.
- *"**Eat** the food."*
- *"**Run!**"*
- *"**Give** him a book."*
- *"**Be** quiet."*

Trigger: any verb in base form at position 0.

### 2. Yes/no question
A question expecting yes or no. Formed by inverting the Subject and an auxiliary or modal. If the underlying clause has no auxiliary, *"do"*-support is inserted.
- *"**Did** you eat?"*
- *"**Can** she swim?"*
- *"**Is** he tired?"*
- *"**Have** they arrived?"*

Trigger: auxiliary verb (do, does, did, am, is, are, was, were, have, has, had) or modal (can, could, will, would, shall, should, may, might, must) at position 0.

### 3. Wh-question
A question asking for specific information. The wh-word fronts to position 0. If the wh-word is the subject, no inversion follows; otherwise subject-aux inversion follows.
- *"**What** did she eat?"*
- *"**Who** broke the vase?"*
- *"**Where** are you going?"*
- *"**How** tall is she?"*

Trigger: wh-word (what, where, when, why, how, who, whom, whose, which) at position 0.

### 4. Adverbial fronting
A topicalized declarative — an adverbial of time, place, or frequency moves to position 0 for emphasis or topic-setting. The Subject and Verb keep their normal order.
- *"**Yesterday**, she ate."*
- *"**On Monday**, we went home."*
- *"**Sometimes** he sings."*

Trigger: time/frequency/place adverb or PP at position 0 (yesterday, today, tomorrow, sometimes, always, often, in the morning, on Monday).

### 5. Negative inversion
A fronted negative or restrictive adverb forces the Subject and auxiliary to invert — like a question, but in a declarative. Marked register, often literary or emphatic.
- *"**Never** have I seen this."*
- *"**Rarely** does she speak."*
- *"**Hardly** had he left."*

Trigger: negative or restrictive adverb at position 0 (never, rarely, seldom, hardly, scarcely, nowhere).

### 6. Quotative inversion
A direct quotation at position 0, followed by an inverted verb of saying and its Subject. Common in narrative writing.
- *"**'Hello,'** said the man."*
- *"**'Yum,'** murmured she."*

Trigger: open quote character (" or ') at position 0.

### 7. Minor sentence / interjection
A standalone discourse element — interjection, greeting, reply, or politeness marker. These don't have a clause structure at all; they exist outside the Subject-Verb framework.
- *"**Hello!**"*
- *"**Sorry.**"*
- *"**Thanks.**"*
- *"**Wow!**"*
- *"**Goodbye.**"*

Trigger: discourse marker at position 0 (hello, hi, hey, wow, oh, sorry, thanks, please, welcome, goodbye, bye, etc.).

### 8. Dummy insertion (existential / cleft)
The surface Subject slot is filled by a dummy *"there"* or *"it"* that doesn't carry meaning. The real Subject (in existentials) or focused element (in clefts) appears later in the sentence.
- *"**There** is a problem."*
- *"**There** were three dogs."*
- *"**It** was the cat that broke the vase."*
- *"**It** is raining."*

Trigger: *"there"* or *"it"* at position 0 followed by a form of *"be"*.

---

## How detection works

When the user types, the system looks at the first word and runs a small dispatch check:

1. Does it match an exception trigger? → place the sentence on the **exception lane**, identify which one of the 8 marked openings.
2. Otherwise → place the sentence on the **fundamental lane** (core group). Treat the words before the verb as the candidate Subject, then identify which of the 9 Subject shapes it matches.

Once the lane is identified, the system can also look at later words:
- On the fundamental lane: detect the verb, look up its argument structure (its allowed shapes), and (in future phases) figure out what slot each later word fills and what's expected next.
- On the exception lane: the full processing of each exception type — extracting the inverted Subject from a yes/no question, finding the gap a wh-word fronted from, etc. — is the next layer of work and not yet built.

---

## Current state

What's working:
- All 9 Subject shapes are cataloged and detected. Detection works for: pronoun, proper noun (via capitalization heuristic), determiner+noun, determiner+adjective+noun, quantifier+noun (with optional adjectives), bare noun (single mass/plural noun, plus adjective+noun without determiner), coordinated subjects (joined by "and"/"or"), gerund (-ing form at sentence start), and infinitive ("to" + verb-base). Plus a noun-number heuristic (singular/plural).
- All 8 Exception shapes are cataloged. All 8 are detected at position 0 — imperative, yes/no question, wh-question, adverbial fronting, negative inversion, quotative inversion, minor sentence/interjection, and dummy insertion (the existential branch).
- Live detection runs on a text input in the Forward Flow tab; the matching shape's card lights up.
- An A/An agreement check warns when *"a apple"* or *"an dog"* is typed.

What's not working yet:
- Inflected verb forms don't match base forms (typing *"gave"* doesn't match `give`'s argument structures).
- The "It was X that..." cleft form isn't detected (only the *"there"* branch of dummy insertion is).
- After-verb processing (Object / Complement / Adverbial slot identification) hasn't been built yet — that's the next major layer.
- Subject-verb agreement isn't enforced.

---

## Architectural note

The macro-layer sketch (see `notes/macro-layer-sketch.md` in the repo) describes a fuller architecture: forward-momentum dispatch, slot roles as primitives, verb argument structures, TAM (tense / aspect / modality / voice / polarity), operations (sentence-level transformations), and a marked-construction registry. This file lists the shape catalogs for the two buckets specifically — the surface-level shape inventory that the live detector tries to recognize.
