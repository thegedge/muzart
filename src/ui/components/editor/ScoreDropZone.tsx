import { Route, useLocation } from "wouter";
import { ScoreDataType, determineScoreType, getFilenameAndMimeType } from "../../../loaders";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { useAsync } from "../../utils/useAsync";
import { InitialPage } from "../misc/InitialPage";
import { Score } from "../misc/Score";
import { PartPanel } from "./PartPanel";

export const ScoreDropZone = () => {
  const application = useApplicationState();
  const [_location, navigate] = useLocation();

  const onDrop = async (event: DragEvent) => {
    event.preventDefault();
    if (!event.dataTransfer) {
      return;
    }

    const sources = filesFromDataTransfer(event.dataTransfer);

    const soundfontFile = sources.find((file) => getFilenameAndMimeType(file).filename.endsWith(".sf2"));
    if (soundfontFile) {
      void application.playback.loadSoundFont(soundfontFile);
    }

    const tabFiles = sources.filter((file) => determineScoreType(file) != ScoreDataType.Unknown);
    if (tabFiles.length > 0) {
      const urls = await Promise.all(
        tabFiles.map(async (tabFile) => {
          const { filename } = getFilenameAndMimeType(tabFile);

          const buffer = await tabFile.arrayBuffer();
          const blob = new Blob([buffer], { type: "application/octet-stream" });
          const url = new URL(`indexed-db:${filename}`);
          await application.tabStorage.store(url, blob);

          return url;
        }),
      );

      navigate(`#/${urls[0].toString()}`);
    }
  };

  return (
    <div
      className="min-w-screen min-h-screen"
      onDrop={(e) => {
        onDrop(e).catch(console.error);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
    >
      <div className="flex flex-col items-center w-screen h-screen max-w-screen max-h-screen overflow-clip">
        <Route path="/:url">
          {(params: { url: string }) => {
            const url = new URL(decodeURIComponent(params.url));
            return <ScoreLoader loaderUrl={url} />;
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

const ScoreLoader = (props: { loaderUrl: URL }) => {
  const { loaderUrl: url } = props;

  const application = useApplicationState();
  const { pending, error } = useAsync(() => application.loadScore(url), [application, url]);

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
