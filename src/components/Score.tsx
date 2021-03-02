import React from "react";
import { Score } from "../notation";
import MeasureRow from "./MeasureRow";

export default function Score(props: { score: Score }) {
  return <MeasureRow measures={props.score.parts[0].measures} />;
}
