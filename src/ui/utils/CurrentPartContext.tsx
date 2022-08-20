import { createContext, useContext } from "react";
import { Part } from "../../notation";

export const CurrentPartContext = createContext<Part | null>(null);

export const useCurrentPart = (): Part => {
  const state = useContext(CurrentPartContext);
  if (state == null) {
    throw new Error("Current part hasn't been set");
  }
  return state;
};
