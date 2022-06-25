import { observer } from "mobx-react-lite";
import React from "react";
import { useApplicationState } from "../utils/ApplicationStateContext";

export const Toolbox = observer(function Toolbox(_props: Record<string, never>) {
  const { selection, debug, score } = useApplicationState();

  if (!score) {
    return null;
  }

  const onPartChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    selection.update({ partIndex: event.target.selectedIndex });
  };

  const onDebugToggled = (event: React.ChangeEvent<HTMLInputElement>) => {
    debug.setEnabled(event.currentTarget.checked);
  };

  return (
    <div className="sticky top-4 h-0">
      <div className="max-w-max flex flex-row items-center bg-black bg-opacity-80 rounded-xl px-2 py-4 absolute right-4 text-gray-400 divide-x space-x-2">
        <div className="px-2">
          <input type="checkbox" name="debug" onChange={onDebugToggled} /> <label htmlFor="debug">Debug</label>
        </div>
        <select
          className="bg-transparent px-2 focus:outline-none"
          onChange={onPartChange}
          defaultValue={selection.partIndex}
        >
          {score.score.parts.map((part, index) => (
            <option key={index} value={index}>
              {part.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});
