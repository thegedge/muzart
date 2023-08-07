import { comparer, reaction } from "mobx";
import { ComponentChildren, createContext } from "preact";
import { Suspense } from "preact/compat";
import { useContext, useEffect, useMemo } from "preact/hooks";
import { PlaybackController } from "../../playback/PlaybackController";
import { Application } from "../state/Application";
import { Selection } from "../state/Selection";
import { DemoStorage } from "../storage/DemoStorage";
import { IndexedDbStorage } from "../storage/IndexedDbStorage";
import { LocalStorage } from "../storage/LocalStorage";
import { TabStorage } from "../storage/TabStorage";
import { APPLICATION_NAMESPACE, APPLICATION_STATE_KEY, TABS_NAMESPACE } from "../storage/namespaces";
import { Loading } from "../ui/misc/Loading";

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

export const CREDENTIALS_NAMESPACE = "credentials";
export const CREDENTIALS_ACCESS_TOKEN_KEY = "access_token";

export const ApplicationState = (props: { children?: ComponentChildren }) => {
  const application = useMemo(() => {
    const settingsStorage = new LocalStorage();

    // Check for access tokens from external storages
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      if (params.has("error")) {
        console.error(params);
      } else if (params.has("access_token")) {
        const accessToken = params.get("access_token");
        if (accessToken) {
          settingsStorage.set(CREDENTIALS_NAMESPACE, CREDENTIALS_ACCESS_TOKEN_KEY, accessToken);
        }
        window.location.hash = "";
      }
    }

    const tabStorage = new TabStorage({
      "demo": new DemoStorage(["Song13.gp4"]),
      "indexed-db": new IndexedDbStorage("muzart_tabs", 1, (oldVersion, _newVersion, db) => {
        if (oldVersion < 1) {
          db.createObjectStore(TABS_NAMESPACE);
        }
      }),
    });
    const selection = new Selection();
    const playback = new PlaybackController(selection);
    return new Application(settingsStorage, tabStorage, selection, playback);
  }, []);

  useEffect(() => {
    window.Muzart = application;

    application.settingsStorage.loadObject(APPLICATION_NAMESPACE, APPLICATION_STATE_KEY, application);

    const disposer = reaction(
      () => application.toJSON(),
      (data) => {
        application.settingsStorage.set(APPLICATION_NAMESPACE, APPLICATION_STATE_KEY, JSON.stringify(data));
      },
      {
        equals: comparer.structural,
        fireImmediately: true,
      },
    );

    return () => {
      disposer();
      delete window.Muzart;
    };
  }, [application]);

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

  return (
    <Suspense fallback={<Loading />}>
      <ApplicationStateContext.Provider value={application}>{props.children}</ApplicationStateContext.Provider>
    </Suspense>
  );
};
