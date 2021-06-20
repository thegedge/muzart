import { defaults } from "lodash";
import React, { createContext, useCallback, useContext, useState } from "react";

export interface Selection {
  part: number;
  measure: number;
  chord: number;
  note: number;
}

interface ReadContextData extends Selection {}

interface WriteContextData {
  setSelection: (selection: Selection) => void;
  updateSelection: (selection: Partial<Selection>) => void;
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

export function SelectionContext(props: { children?: React.ReactNode }) {
  const [selection, setSelection] = useState({
    part: 0,
    measure: 0,
    chord: 0,
    note: 0,
  });

  const updateSelection = useCallback(
    (selection: Partial<Selection>) => {
      setSelection((current) => {
        const a = selection.part && selection.part != current.part;
        const b = selection.measure && selection.measure != current.measure;
        const c = selection.chord && selection.chord != current.chord;
        const d = selection.note && selection.note != current.note;
        if (a || b || c || d) {
          return defaults(selection, current);
        }
        return current;
      });
    },
    [setSelection]
  );

  return (
    <ReadContext.Provider value={selection}>
      <WriteContext.Provider value={{ setSelection, updateSelection }}>{props.children}</WriteContext.Provider>
    </ReadContext.Provider>
  );
}
