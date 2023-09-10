import { ComponentChildren, createContext } from "preact";
import { Suspense } from "preact/compat";
import { useContext, useEffect, useMemo } from "preact/hooks";
import { PlaybackController } from "../../playback/PlaybackController";
import { Loading } from "../components/misc/Loading";
import { Application } from "../state/Application";
import { Selection } from "../state/Selection";
import { DemoStorage } from "../storage/DemoStorage";
import { IndexedDbStorage } from "../storage/IndexedDbStorage";
import { LocalStorage } from "../storage/LocalStorage";
import { TabStorage } from "../storage/TabStorage";
import { TABS_NAMESPACE } from "../storage/namespaces";

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
    const settingsStorage = new LocalStorage();
    const tabStorage = new TabStorage({
      "demo": new DemoStorage(["Song13.gp4"]),
      "indexed-db": new IndexedDbStorage("muzart_tabs", 1, (oldVersion, _newVersion, db) => {
        if (oldVersion < 1) {
          db.createObjectStore(TABS_NAMESPACE);
        }
      }),
    });
    const selection = new Selection(settingsStorage);
    const playback = new PlaybackController(selection);
    const application = new Application(settingsStorage, tabStorage, selection, playback);
    window.Muzart = application;
    return application;
  }, []);

  useEffect(() => {
    if (application.selection.score != null) {
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

  if (import.meta.env.DEV) {
    useEffect(() => {
      if (application.selection.score != null) {
        return;
      }

      const defaultURL = application.settingsStorage.get("view", "lastTab");
      if (defaultURL) {
        try {
          void application.loadScore(defaultURL);
        } catch (error) {
          // Assume old data that is incorrect
        }
      }
    }, [application]);
  }

  return (
    <Suspense fallback={<Loading />}>
      <ApplicationStateContext.Provider value={application}>{props.children}</ApplicationStateContext.Provider>
    </Suspense>
  );
};
