import { clone, defaults, first, inRange, last } from "lodash";
import React, { createContext, useCallback, useContext, useState } from "react";
import { Chord, getAncestorOfType, LayoutElement, Measure, Note, Score } from "../../layout";

export interface Selection {
  part: number;
  measure: number;
  chord: number;
  note: number;
  element?: LayoutElement<any>;
}

interface ReadContextData extends Selection {}

interface WriteContextData {
  setSelection: (selection: Selection) => void;
  updateSelection: (selection: Partial<Selection>) => void;
  updateSelectionFor: (element: LayoutElement) => void;
}

const ReadContext = createContext<ReadContextData>({
  part: 0,
  measure: 0,
  chord: 0,
  note: 0,
});

const WriteContext = createContext<WriteContextData>({
  setSelection: (_: Selection) => {},
  updateSelection: (_: Partial<Selection>) => {},
  updateSelectionFor: (_: LayoutElement) => {},
});

export function useWriteSelection() {
  return useContext(WriteContext);
}

export function useReadSelection() {
  return useContext(ReadContext);
}

export function useSelection() {
  const read = useReadSelection();
  const write = useWriteSelection();
  return { selection: read, ...write };
}

export function SelectionContext(props: { score: Score; children?: React.ReactNode }) {
  const [selection, setSelection] = useState<Selection>({
    part: 0,
    measure: 0,
    chord: 0,
    note: 0,
  });

  const updateSelection = useCallback(
    (selection: Partial<Selection>) => {
      setSelection((current) => {
        const p = selection.part && selection.part != current.part;
        const m = selection.measure && selection.measure != current.measure;
        const c = selection.chord && selection.chord != current.chord;
        const n = selection.note && selection.note != current.note;
        const e = selection.element != current.element;
        if (p || m || c || n || e) {
          if (!selection.element) {
            // No element was explicitly given, but something else changed. It's unlikely that the previously
            // specified element is still correct, so pick one based on the indices.
            selection = clone(selection);

            const part = props.score.parts[selection.part ?? current.part];
            const measureIndex = selection.measure ?? current.measure;
            const page = part.pages.find((p) =>
              inRange(
                measureIndex + 1,
                first(p.measures)?.measure?.number ?? -1,
                (last(p.measures)?.measure?.number ?? -1) + 1
              )
            );

            if (page) {
              const measure = page.measures[selection.measure ?? current.measure];
              let chord = measure.chords[selection.chord ?? current.chord];
              if (!chord) {
                selection.chord = 0;
                selection.note = 0;
                chord = measure.chords[0];
              }

              if (chord.type == "Rest") {
                selection.element = chord;
              } else {
                selection.element = chord.notes[selection.note ?? current.note];
              }
            }
          }

          return defaults(selection, current);
        }
        return current;
      });
    },
    [setSelection]
  );

  const updateSelectionFor = useCallback(
    (element: LayoutElement) => {
      // TODO optimize getting indexes (context?)

      const noteElement = getAncestorOfType<Note>(element, "Note");
      const chordElement = getAncestorOfType<Chord>(noteElement ?? element, "Chord");
      const measureElement = getAncestorOfType<Measure>(noteElement ?? chordElement ?? element, "Measure");

      updateSelection({
        measure: measureElement && measureElement.measure.number - 1,
        chord:
          chordElement &&
          measureElement &&
          measureElement.measure.chords.findIndex((n) => Object.is(n, chordElement.chord)),
        note: noteElement && chordElement && chordElement.notes.findIndex((n) => Object.is(n, noteElement)),
        element,
      });
    },
    [updateSelection]
  );

  return (
    <ReadContext.Provider value={selection}>
      <WriteContext.Provider value={{ setSelection, updateSelection, updateSelectionFor }}>
        {props.children}
      </WriteContext.Provider>
    </ReadContext.Provider>
  );
}
