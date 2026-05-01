# Unit: Complement (C)

Reserved unit folder. Not built yet.

When the Complement unit is built, this folder will mirror `subject/`:

```
shapes.en.js        — alternative catalog of Complement filler shapes
shapesIndex.js      — language router (getComplementShapes / getComplementShape)
detector.js         — given the post-verb tokens + verb context, classify the Complement filler
ShapeCard.jsx       — card component used inside the sub-tab and (later) StatusBlock
StatusBlock.jsx     — accordion section for the live status panel
SubTabContent.jsx   — full sub-tab content
```

Complement filler shapes (from `notes/macro-layer-sketch.md` and `slotRoles.en.js`):
- NP ("She is a teacher")
- AdjP ("She is happy")
- PP ("She is in the garden")
- Gerund clause
- Infinitive clause

Polymorphism: Subject Complement (Cs) attaches to Subject — used after
copular verbs (be, seem, become, etc.). Object Complement (Co) attaches
to Object — used after verbs like paint, call, consider, make. Same role;
attachment determined by clause structure (SVC vs. SVOC frame).
