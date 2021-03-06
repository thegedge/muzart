import React from "react";
import * as layout from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";
import ScoreElement from "./ScoreElement";

export function Measure(props: { measure: layout.Measure }) {
  // TODO index keys aren't super useful here, once we support editing
  return (
    <BoxGroup node={props.measure}>
      {props.measure.elements.map((element, index) => (
        <ScoreElement key={index} element={element} />
      ))}
    </BoxGroup>
  );
}
