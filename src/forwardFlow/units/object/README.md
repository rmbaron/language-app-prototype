# Unit: Object (O)

Reserved unit folder. Not built yet.

When the Object unit is built, this folder will mirror `subject/`:

```
shapes.en.js        — alternative catalog of Object filler shapes
shapesIndex.js      — language router (getObjectShapes / getObjectShape)
detector.js         — given the post-verb tokens + verb context, classify the Object filler
ShapeCard.jsx       — card component used inside the sub-tab and (later) StatusBlock
StatusBlock.jsx     — accordion section for the live status panel
SubTabContent.jsx   — full sub-tab content
```

Object filler shapes (from `notes/macro-layer-sketch.md` and `slotRoles.en.js`):
- NP (most common)
- Pronoun (object case: me, him, her, us, them, it)
- Gerund clause ("I enjoy swimming")
- Infinitive clause ("I want to leave")
- That-clause ("I think she is happy")
- Wh-clause ("I know what she means")
- Bare-infinitive clause ("I made him cry")

Polymorphism: O can fire once (direct) or twice (indirect + direct, in
ditransitives). Distinction is encoded in the verb's argument structure
(SVOO frame), not in the role itself.

Verbs declare per-O accepted filler types — `want.O.fillers = [NP, infinitive]`
but `think.O.fillers = [NP, that_clause]`. "I think to eat" is bad because
think doesn't accept infinitive complements.
