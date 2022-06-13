import React, { createContext, useContext, useMemo } from "react";
import { Application } from "../state/Application";

const ApplicationStateContext = createContext<Application | null>(null);

export function useApplicationState(): Application {
  const state = useContext(ApplicationStateContext);
  if (state == null) {
    throw new Error("Application state hasn't been set");
  }
  return state;
}

export function ApplicationState(props: { children?: React.ReactNode }) {
  const state = useMemo(() => new Application(), []);
  return <ApplicationStateContext.Provider value={state}>{props.children}</ApplicationStateContext.Provider>;
}
