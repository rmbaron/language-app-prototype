# Unit: Adverbial (A)

Reserved unit folder. Not built yet.

When the Adverbial unit is built, this folder will mirror `subject/`:

```
shapes.en.js        — alternative catalog of Adverbial filler shapes
shapesIndex.js      — language router (getAdverbialShapes / getAdverbialShape)
detector.js         — given the post-verb tokens + verb context, classify the Adverbial filler
ShapeCard.jsx       — card component used inside the sub-tab and (later) StatusBlock
StatusBlock.jsx     — accordion section for the live status panel
SubTabContent.jsx   — full sub-tab content
```

Adverbial filler shapes (from `notes/macro-layer-sketch.md` and `slotRoles.en.js`):
- AdvP ("She ran quickly")
- PP ("He lives in London")
- NP_temporal ("yesterday", "Monday morning")
- Subordinate clause ("when she arrived")

Optional vs. obligatory: declared per-verb in argument structure. Live,
put, remain require an A; eat, sleep do not. Multiple optional Adverbials
can attach to one clause: "She ran [quickly] [yesterday] [in the park]".

Frequency adverbs have fixed positions (pre-verbal): "She [always] eats food",
not "She eats [always] food".

Adverbial fronting is an operation handled in the exceptions unit
(adverbial_fronting lane), not here.
