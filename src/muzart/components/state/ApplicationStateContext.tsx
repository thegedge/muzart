import React, { createContext, Suspense, useContext, useMemo } from "react";
import { PlaybackController } from "../../../playback/PlaybackController";
import { Loading } from "../../../shared/components/Loading";
import { Suspenseful, suspenseful } from "../../../shared/utils/suspenseful";
import { Application } from "./Application";

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
    return suspenseful(async () => {
      const playback = await PlaybackController.construct();
      const application = new Application(playback);
      window.Muzart = application;
      return application;
    });
  }, []);

  return (
    <Suspense fallback={<Loading />}>
      <ApplicationFetcher application={application}>{props.children}</ApplicationFetcher>
    </Suspense>
  );
}

function ApplicationFetcher(props: { application: Suspenseful<Application>; children?: React.ReactNode }) {
  const application = props.application.read();
  return <ApplicationStateContext.Provider value={application}>{props.children}</ApplicationStateContext.Provider>;
}
