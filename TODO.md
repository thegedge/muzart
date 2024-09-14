<!-- markdownlint-disable-file MD024 -->

# Muzart TODO

## Features

### Editor actions

- Score
  - Edit all of the bits of the score header
- Parts
  - Change instrument
  - Change color
- Measure
  - Tempo
  - Measure repeats
  - Once score rendering works
    - Clef
    - Key signature
- Chords
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
- Find a better way of constructing all the notation objects

## Bugs

### Layout

- Need to measure text to have an appropriately sized box for some things

### Rendering

- Text slightly clipped at the first line on a page; see Guitar 1 (slash) track of sweet child of mine, measure 146

### Playback

- Playback box keeps going (only sometimes, maybe all the time?) when reaching the end
- Vibrato doesn't work on mid/end sections of ties
- Not hearing dead notes
- Chords should probably have some kind of gain value applied to make them not sound super loud compared to a single
  note. Could perhaps also do all of the combining in the karplus-strong audio worklet
