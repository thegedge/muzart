<!-- markdownlint-disable-file MD024 -->

# Muzart TODO

## Features

### Editor actions

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
  - Tuplets
  - Ties
  - Grace notes
  - Slides

### Rendering

- Needs layout / lacking render
  - Staccato
- Inherited CSS properties

### Other

- Swap out body with SVG when printing (see beforeprint / afterprint listeners)
- Remember play/mute settings for tracks

## Bugs

### Layout

- Need to measure text to have an appropriately sized box for some things

### Rendering

- Text slightly clipped at the first line on a page; see Guitar 1 (slash) track of sweet child of mine, measure 130

### Other

- Vibrato doesn't work on mid/end sections of ties
- Not hearing dead notes
