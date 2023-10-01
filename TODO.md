# Muzart TODO

## Editor actions

- Score
  - Edit all of the bits of the score header
- Parts
  - Add
  - Remove
  - Change instrument
  - Change name
  - Change color
- Measure
  - Time signature
  - Tempo
  - Measure repeats
  - Once score rendering works
    - Clef
    - Key signature
- Chords
  - Add
  - Remove
  - Clear
  - Chord diagrams
  - Edit text annotation
  - Add marker
  - Remove marker
  - Strum direction
  - Tapping
- Notes
  - Vibrato
  - Dead notes
  - Palm mutes
  - Staccato
  -
  - Bends
  - Tuplets
  - Ties
  - Dynamic
  - Ghost notes
  - Grace notes
  - Harmonics
  - Slides

## Rendering

- Inherited CSS properties
- Text clipped at the first line on a page; see Guitar 1 (slash) track of sweet child of mine, measure 130

## Bugs

- When moving from one part to another, the selected note is sometimes `undefined` even if there is a note under the selection box
- When toggling hammer-ons/pull-offs, we need to redo the layout