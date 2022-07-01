import React from "react";
import { filenameFrom } from "../io/fileTypes";
import { useDragDropHelpers } from "../muzart/components/utils/useDragDropHelpers";
import "./app.css";
import { ApplicationState, useApplicationState } from "./state/ApplicationStateContext";
import { BytesViewer } from "./ui/BytesViewer";

export default function App() {
  return (
    <div className="bg-gray-400 min-h-screen">
      <div className="bg-gray-400 text-gray-100 opacity-80 fixed top-0 left-0 px-2 py-1">
        <a href="https://github.com/thegedge/muzart" className="underline">
          Source on GitHub
        </a>
      </div>
      <ApplicationState>
        <DropZone />
      </ApplicationState>
    </div>
  );
}

const DropZone = () => {
  const application = useApplicationState();

  const dragDropProps = useDragDropHelpers((file) => {
    const filename = filenameFrom(file);
    if (filename.endsWith(".sf2")) {
      //
    } else if (filename.endsWith(".gp4")) {
      //
    }

    application.loadFromFile(file);
  });

  return (
    <div {...dragDropProps} className="min-h-screen w-full">
      <BytesViewer />
    </div>
  );
};
