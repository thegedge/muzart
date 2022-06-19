import React from "react";
import { Score } from "../../../notation";
import { useApplicationState } from "../utils/ApplicationStateContext";

export function Toolbox(props: { score: Score; onDebugToggled: (value: boolean) => void }) {
  const { selection } = useApplicationState();

  const onPartChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    selection.update({ partIndex: event.target.selectedIndex });
  };

  const onDebugToggled = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.onDebugToggled(event.target.checked);
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
          {props.score.parts.map((part, index) => (
            <option key={index} value={index}>
              {part.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
