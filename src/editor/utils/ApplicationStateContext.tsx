import { comparer, reaction } from "mobx";
import { ComponentChildren, createContext } from "preact";
import { Suspense } from "preact/compat";
import { useContext, useEffect, useMemo } from "preact/hooks";
import { Box } from "../../layout";
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

const ApplicationStateContext = createContext<Application | null>(null);

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
    const selection = new Selection();
    const playback = new PlaybackController(selection);
    return new Application(settingsStorage, tabStorage, selection, playback);
  }, []);

  useEffect(() => {
    return () => application.dispose();
  }, [application]);

  useEffect(() => {
    if (!application.canvas.canvas) {
      return;
    }

    return reaction(
      () => application.selection.score?.box,
      (box, prev) => {
        if (box) {
          application.canvas.setUserSpaceSize(box);
          if (!prev) {
            const aspectRatio = application.canvas.canvasWidth / application.canvas.canvasHeight;
            application.canvas.setViewport(new Box(0, 0, box.width, box.width / aspectRatio));
          }
        }
      },
      {
        fireImmediately: true,
        equals: (a, b) => !!(b ? a?.equals(b) : false),
      },
    );
  }, [application, application.canvas.canvas]);

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
