import { ComponentChildren, createContext } from "preact";
import { Suspense } from "preact/compat";
import { useContext, useEffect, useMemo } from "preact/hooks";
import { PlaybackController } from "../../playback/PlaybackController";
import { Loading } from "../components/misc/Loading";
import { Application } from "../state/Application";
import { Selection } from "../state/Selection";
import { LocalStorage } from "../storage/LocalStorage";

declare global {
  interface Window {
    Muzart: Application | undefined;
  }
}

export const ApplicationStateContext = createContext<Application | null>(null);

export const useApplicationState = (): Application => {
  const state = useContext(ApplicationStateContext);
  if (state == null) {
    throw new Error("Application state hasn't been set");
  }
  return state;
};

export const ApplicationState = (props: { children?: ComponentChildren }) => {
  const application = useMemo(() => {
    const storage = new LocalStorage(globalThis.localStorage);
    const selection = new Selection(storage);
    const playback = new PlaybackController(selection);
    const application = new Application(storage, selection, playback);
    window.Muzart = application;
    return application;
  }, []);

  useEffect(() => {
    if (application.score != null) {
      return;
    }

    let defaultSoundfont = import.meta.env.VITE_DEFAULT_SOUNDFONT || null;
    if (!defaultSoundfont) {
      return;
    }

    if (!/^https?:\/\//.test(defaultSoundfont)) {
      const sfPath = defaultSoundfont.split("/").map(encodeURIComponent).join("/");
      defaultSoundfont = `soundfonts/${sfPath}`;
    }

    void application.playback.loadSoundFont(defaultSoundfont);
  }, [application]);

  // if (import.meta.env.DEV) {
  //   useEffect(() => {
  //     if (application.score != null) {
  //       return;
  //     }

  //     let defaultFile: string | File | null = null;

  //     const lastViewedTab = application.storage.get("view", "lastTab");
  //     if (lastViewedTab) {
  //       const lastViewedTabData = application.storage.getBlob("tabs", lastViewedTab);
  //       if (lastViewedTabData) {
  //         defaultFile = new File([lastViewedTabData], lastViewedTab);
  //       }
  //     }

  //     defaultFile ??= "songs/Song13.gp4";

  //     void application.loadScore(defaultFile);
  //   }, [application]);
  // }

  return (
    <Suspense fallback={<Loading />}>
      <ApplicationStateContext.Provider value={application}>{props.children}</ApplicationStateContext.Provider>
    </Suspense>
  );
};
