import React, { useCallback } from "react";
import { Score } from "../notation";

export function Toolbox(props: { score: Score; onPartChange: (index: number) => void }) {
  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      props.onPartChange(event.target.selectedIndex);
    },
    [props.onPartChange]
  );

  return (
    <div className="sticky top-0 pt-4">
      <div className="max-w-max flex flex-row bg-black bg-opacity-80 rounded-xl px-4 absolute right-4">
        <select className="bg-transparent text-gray-400 p-4 focus:outline-none" onChange={onChange}>
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
