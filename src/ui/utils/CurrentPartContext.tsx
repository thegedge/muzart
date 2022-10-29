import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { Part } from "../../notation";

export const CurrentPartContext = createContext<Part | null>(null);

export const useCurrentPart = (): Part => {
  const state = useContext(CurrentPartContext);
  if (state == null) {
    throw new Error("Current part hasn't been set");
  }
  return state;
};
