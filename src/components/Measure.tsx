import { clone } from "lodash";
import React from "react";
import * as layout from "../layout";
import { BoxGroup } from "./BoxGroup";
import { Chord } from "./Chord";
import LineElementComponent from "./LineElement";
import { TextElement } from "./TextElement";

export function Measure(props: { measure: layout.Measure }) {
  return (
    <BoxGroup node={props.measure}>
      {props.measure.elements.map((element) => {
        switch (element.type) {
          case "Chord":
            return <Chord chord={element} />;
          case "Rest":
            let box = clone(element.box);
            let height = 0.1;
            let width = height * 2;
            box.x += (box.width - width) * 0.5;
            box.y += (box.height - 2 * height) * 0.5;
            box.width = width;
            box.height = height;
            return (
              <TextElement
                box={box}
                align="center"
                size={height}
                text="rest"
                fill
                style={{ fontWeight: 100, fontStyle: "italic", fill: "#aa5555" }}
              />
            );
          default:
            return <LineElementComponent element={element} />;
        }
      })}
    </BoxGroup>
  );
}
