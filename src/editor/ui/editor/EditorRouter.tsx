import { Route, useLocation } from "wouter";
import { ScoreDataType, determineScoreType, getFilenameAndMimeType } from "../../../loaders";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { InitialPage } from "../misc/InitialPage";
import { EditorChrome } from "./EditorChrome";

export const EditorRouter = () => {
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
      className="min-h-screen min-w-screen"
      onDrop={(e) => {
        onDrop(e).catch(console.error);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
    >
      <div className="flex h-screen max-h-screen w-screen max-w-screen flex-col items-center overflow-clip">
        <Route path="/:url">
          {(params: { url: string }) => {
            const url = decodeURIComponent(params.url);
            return <EditorChrome loaderUrl={url} />;
          }}
        </Route>
        <Route path="/">
          {(_params: undefined) => {
            application.setScore(null);
            return <InitialPage />;
          }}
        </Route>
      </div>
    </div>
  );
};

const filesFromDataTransfer = (dataTransfer: DataTransfer): File[] => {
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
