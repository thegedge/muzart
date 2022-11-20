import { useEffect } from "preact/hooks";
import { Route, useLocation } from "wouter";
import { determineScoreType, getFilenameAndMimeType, ScoreDataType } from "../../../loaders";
import { TABS_NAMESPACE } from "../../storage/namespaces";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { InitialPage, SongTypes } from "../misc/InitialPage";
import { Score } from "../misc/Score";
import { PartPanel } from "./PartPanel";

export const ScoreDropZone = () => {
  const application = useApplicationState();
  const [_location, navigate] = useLocation();

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    if (!event.dataTransfer) {
      return;
    }

    const sources = filesFromDataTransfer(event.dataTransfer);
    const soundfontFile = sources.find((file) => getFilenameAndMimeType(file).filename.endsWith(".sf2"));
    const tabFile = sources.find((file) => determineScoreType(file) != ScoreDataType.Unknown);

    if (soundfontFile) {
      void application.playback.loadSoundFont(soundfontFile);
    }

    if (tabFile) {
      const { filename } = getFilenameAndMimeType(tabFile);
      navigate(`#/storage/${filename}`);
    }
  };

  return (
    <div
      className="min-w-screen min-h-screen"
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault();
      }}
    >
      <div className="flex flex-col items-center w-screen h-screen max-w-screen max-h-screen overflow-clip">
        <Route path="/:source/:name">
          {(params: { source: SongTypes["source"]; name: string }) => {
            const name = decodeURIComponent(params.name);
            return <ScoreLoader name={name} source={params.source} />;
          }}
        </Route>
        <Route path="/">
          {(_params: undefined) => {
            application.setScore(null);
            return (
              <div className="w-full overflow-auto">
                <InitialPage />
              </div>
            );
          }}
        </Route>
      </div>
    </div>
  );
};

const ScoreLoader = (props: { source: SongTypes["source"]; name: string }) => {
  const { source, name } = props;
  const application = useApplicationState();

  useEffect(() => {
    switch (source) {
      case "demo": {
        const base = import.meta.env.BASE_URL;
        if (base == "") {
          void application.loadScore(`${base}songs/${name}`);
        } else {
          void application.loadScore(`songs/${name}`);
        }
        return;
      }
      case "storage": {
        const tabData = application.storage.loadBlob(TABS_NAMESPACE, name);
        if (!tabData) {
          throw new Error(`${name} not found in local storage!`);
        }

        const file = new File([tabData], name);
        void application.loadScore(file);
      }
    }
  }, [source, name]);

  return (
    <div className="flex flex-col w-screen h-screen max-w-screen max-h-screen">
      <Score />
      <PartPanel />
    </div>
  );
};

export const filesFromDataTransfer = (dataTransfer: DataTransfer): File[] => {
  const sources: File[] = [];

  for (let i = 0; i < dataTransfer.items.length; i++) {
    if (dataTransfer.items[i].kind === "file") {
      const file = dataTransfer.items[i].getAsFile();
      if (file) {
        sources.push(file);
      }
    }
  }

  for (let i = 0; i < dataTransfer.files.length; i++) {
    const file = dataTransfer.files[i];
    sources.push(file);
  }

  return sources;
};