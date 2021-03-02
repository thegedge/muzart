import React from "react";
import { Score } from "../notation";
import MeasureRow from "./MeasureRow";

export default function Score(props: { score?: Score }) {
  return (
    <div className="bg-gray-400 p-24 min-h-screen">
      <div className="mx-auto bg-white p-24 border-black border">
        {props.score && props.score.parts[0] && <MeasureRow measures={props.score.parts[2].measures} />}
      </div>
    </div>
  );
}
