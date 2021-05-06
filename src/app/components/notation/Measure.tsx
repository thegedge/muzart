import React from "react";
import * as layout from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";
import { Chord } from "./Chord";
import { Rest } from "./Rest";
import ScoreElement from "./ScoreElement";

export function Measure(props: { measure: layout.Measure }) {
  // TODO index keys aren't super useful here, once we support editing
  return (
    <BoxGroup node={props.measure}>
      {props.measure.elements.map((element, index) => {
        switch (element.type) {
          case "Chord":
            return <Chord key={index} chord={element} />;
          case "Rest":
            return <Rest key={index} node={element} />;
          default:
            return <ScoreElement key={index} element={element} />;
        }
      })}
    </BoxGroup>
  );
}
