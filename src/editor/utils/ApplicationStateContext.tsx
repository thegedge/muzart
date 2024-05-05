import { comparer, reaction } from "mobx";
import { ComponentChildren, createContext } from "preact";
import { Suspense } from "preact/compat";
import { useContext, useEffect, useMemo } from "preact/hooks";
import layout, {
  ancestorOfType,
  toAncestorCoordinateSystem,
  type AllElements,
  type Box,
  type LineElement,
} from "../../layout";
import { PlaybackController } from "../../playback/PlaybackController";
import { Application } from "../state/Application";
import { Selection } from "../state/Selection";
import { DemoStorage } from "../storage/DemoStorage";
import { IndexedDbStorage } from "../storage/IndexedDbStorage";
import { LocalStorage } from "../storage/LocalStorage";
import { TabStorage } from "../storage/TabStorage";
import { APPLICATION_NAMESPACE, APPLICATION_STATE_KEY, TABS_NAMESPACE } from "../storage/namespaces";
import { Loading } from "../ui/misc/Loading";
import { selectionBoxFor } from "../ui/misc/selectionBoxFor";

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
    const observer = new ResizeObserver((entries) => {
      application.setBodyDimensions(entries[0].contentBoxSize[0].inlineSize, entries[0].contentBoxSize[0].blockSize);
    });

    observer.observe(document.body);
    return () => observer.disconnect();
  }, [application]);

  useEffect(() => {
    let disableNext = false;

    // TODO this unfortunately triggers when we move between large/small screen mode, when we ideally want to maintain
    //  the current viewport. Find a solution to either make it not trigger, or temporarily "disable" it.
    return reaction(
      () =>
        [
          application.playback.currentMeasure ?? application.selection.element,
          application.selection.noteIndex,
          application.isSmallScreen,
        ] as const,
      ([element, selectedNoteIndex, isSmallScreen], previous) => {
        if (!element) {
          return;
        }

        // When we switch screen mode, the layout element changes, but we don't want to adjust the viewport.
        if (isSmallScreen != previous[2]) {
          disableNext = true;
          return;
        } else if (disableNext) {
          // TODO we unfortunately have to do this `disableNext` approach because this reaction is triggered twice on screen mode change,
          //   first by `isSmallScreen` and then by the selection element. Try to find a better way.
          disableNext = false;
          return;
        }

        let box: Box;
        if (element.type == "Chord" || element.type == "Rest") {
          box = selectionBoxFor(element, selectedNoteIndex);
        } else if (element.type == "Note") {
          const chord = ancestorOfType<LineElement, layout.Chord>(element, "Chord");
          if (chord) {
            box = selectionBoxFor(chord, selectedNoteIndex);
          } else {
            const line = ancestorOfType<AllElements>(element, "PageLine") ?? element;
            box = toAncestorCoordinateSystem(line);
          }
        } else {
          const line = ancestorOfType<AllElements>(element, "PageLine") ?? element;
          box = toAncestorCoordinateSystem(line);
        }

        application.canvas.scrollIntoView(box);
      },
    );
  }, [application]);

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
