import React, { createContext, Suspense, useContext, useMemo } from "react";
import { PlaybackController } from "../../../playback/PlaybackController";
import { Application } from "../state/Application";
import { Selection } from "../state/Selection";
import { Loading } from "../ui/Loading";

declare global {
  interface Window {
    Muzart: Application | undefined;
  }
}

export const ApplicationStateContext = createContext<Application | null>(null);

export function useApplicationState(): Application {
  const state = useContext(ApplicationStateContext);
  if (state == null) {
    throw new Error("Application state hasn't been set");
  }
  return state;
}

export function ApplicationState(props: { children?: React.ReactNode }) {
  const application = useMemo(() => {
    const selection = new Selection();
    const playback = new PlaybackController(selection);
    const application = new Application(selection, playback);
    window.Muzart = application;
    return application;
  }, []);

  return (
    <Suspense fallback={<Loading />}>
      <ApplicationStateContext.Provider value={application}>{props.children}</ApplicationStateContext.Provider>
    </Suspense>
  );
}
