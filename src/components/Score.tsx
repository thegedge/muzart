import React from "react";
import { Score } from "../notation";
import MeasureRow from "./MeasureRow";

export default function Score(props: { score?: Score }) {
  // TODO eventually we'll be able to switch between them
  const partIndex = 0;

  return (
    <div className="bg-gray-400 p-24 min-h-screen">
      <div className="mx-auto bg-white p-24 border-black border">
        {props.score && (
          <>
            {props.score.title && <h1 className="text-center text-4xl font-serif mb-4">{props.score.title}</h1>}
            {props.score.composer && (
              <h2 className="text-center text-large font-serif mb-16">{props.score.composer}</h2>
            )}
            {props.score.parts[partIndex] && <MeasureRow measures={props.score.parts[partIndex].measures} />}
          </>
        )}
      </div>
    </div>
  );
}
