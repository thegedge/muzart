import React, { createContext, useContext, useState } from "react";

export interface Selection {
  part: number;
  measure: number;
  chord: number;
  note: number;
}

interface ContextData {
  indices: Selection;
  setSelection: (selection: Selection) => void;
}

const Context = createContext<ContextData>({
  indices: {
    part: 0,
    measure: 0,
    chord: 0,
    note: 0,
  },
  setSelection: (_: Selection) => {},
});

export function useSelection() {
  return useContext(Context);
}

export function SelectionContext(props: { children?: React.ReactNode }) {
  const [indices, setSelection] = useState({
    part: 0,
    measure: 0,
    chord: 0,
    note: 0,
  });

  return <Context.Provider value={{ indices, setSelection }}>{props.children}</Context.Provider>;
}
