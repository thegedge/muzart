import { defaults } from "lodash";
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
          return defaults(selection, current);
        }
        return current;
      });
    },
    [setSelection]
  );

  const updateSelectionFor = (element: LayoutElement) => {
    // TODO optimize getting indexes (context?)

    const noteElement = getAncestorOfType<Note>(element, "Note");
    const chordElement = getAncestorOfType<Chord>(noteElement ?? element, "Chord");
    const measureElement = getAncestorOfType<Measure>(noteElement ?? chordElement ?? element, "Measure");

    updateSelection({
      measure: measureElement && measureElement.measure.number,
      chord:
        chordElement &&
        measureElement &&
        measureElement.measure.chords.findIndex((n) => Object.is(n, chordElement.chord)),
      note: noteElement && chordElement && chordElement.notes.findIndex((n) => Object.is(n, element)),
      element: element,
    });
  };

  return (
    <ReadContext.Provider value={selection}>
      <WriteContext.Provider value={{ setSelection, updateSelection, updateSelectionFor }}>
        {props.children}
      </WriteContext.Provider>
    </ReadContext.Provider>
  );
}
