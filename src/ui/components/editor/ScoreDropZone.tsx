import { Route, useLocation } from "wouter";
import { determineScoreType, getFilenameAndMimeType, ScoreDataType } from "../../../loaders";
import { TABS_NAMESPACE } from "../../storage/namespaces";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { useAsync } from "../../utils/useAsync";
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
      application
        .loadScore(tabFile)
        .then(() => navigate(`#/storage/${filename}`))
        .catch(console.error); // TODO better error handling
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

  const { pending, error } = useAsync(async () => {
    switch (source) {
      case "demo": {
        const base = import.meta.env.BASE_URL;
        if (base == "") {
          await application.loadScore(`${base}songs/${name}`);
        } else {
          await application.loadScore(`songs/${name}`);
        }
        break;
      }
      case "storage": {
        const tabData = await application.tabStorage.loadBlob(TABS_NAMESPACE, name);
        if (!tabData) {
          throw new Error(`${name} not found!`);
        }

        const file = new File([tabData], name);
        await application.loadScore(file);
        break;
      }
    }
  }, [source, name]);

  if (error) {
    throw error;
  }

  if (pending) {
    return null;
  }

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
