import React from "react";
import { Score } from "../notation";
import MeasureRow from "./MeasureRow";

export default function Score(props: { score: Score }) {
  return (
    <div className="flex flex-row m-12">
      <MeasureRow measures={props.score.parts[0].measures} />
    </div>
  );
}
