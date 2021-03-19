import React from "react";
import * as layout from "../layout";
import { BoxGroup } from "./BoxGroup";
import { Chord } from "./Chord";
import LineElementComponent from "./LineElement";
import { Rest } from "./Rest";

export function Measure(props: { measure: layout.Measure }) {
  return (
    <BoxGroup node={props.measure}>
      {props.measure.elements.map((element) => {
        switch (element.type) {
          case "Chord":
            return <Chord chord={element} />;
          case "Rest":
            return <Rest node={element} />;
          default:
            return <LineElementComponent element={element} />;
        }
      })}
    </BoxGroup>
  );
}
