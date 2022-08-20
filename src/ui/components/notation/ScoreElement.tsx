import React, { JSX } from "react";
import { LineElement, PageElement } from "../../../layout";
import { BoxGroup } from "../layout/BoxGroup";
import { Arc } from "./Arc";
import { BarLine } from "./BarLine";
import { Beam } from "./Beam";
import { Bend } from "./Bend";
import { ChordDiagram } from "./ChordDiagram";
import { DashedLineText } from "./DashedLineText";
import { Dot } from "./Dot";
import { Measure } from "./Measure";
import { Note } from "./Note";
import { Rest } from "./Rest";
import { Slide } from "./Slide";
import { Stroke } from "./Stroke";
import { TextElement } from "./TextElement";
import { TimeSignature } from "./TimeSignature";
import { Vibrato } from "./Vibrato";

export const ScoreElement = (props: { element: PageElement | LineElement }): JSX.Element => {
  switch (props.element.type) {
    case "Arc":
      return <Arc element={props.element} />;
    case "BarLine":
      return <BarLine node={props.element} />;
    case "Bend":
      return <Bend node={props.element} />;
    case "Beam":
      return <Beam node={props.element} />;
    case "ChordDiagram":
      return <ChordDiagram element={props.element} />;
    case "DashedLineText":
      return <DashedLineText element={props.element} />;
    case "Dot":
      return <Dot node={props.element} />;
    case "Chord":
    case "Group":
    case "PageLine":
      return (
        <BoxGroup node={props.element}>
          {props.element.children.map((e, index) => (
            <ScoreElement key={index} element={e} />
          ))}
        </BoxGroup>
      );
    case "Line":
      return (
        <line
          x1={props.element.box.x}
          y1={props.element.box.y}
          x2={props.element.box.right}
          y2={props.element.box.bottom}
          stroke={props.element.color}
        />
      );
    case "Measure":
      return <Measure measure={props.element} />;
    case "Note":
      return <Note note={props.element} />;
    case "Stroke":
      return <Stroke node={props.element} />;
    case "Rest":
      return <Rest node={props.element} />;
    case "Slide":
      return <Slide node={props.element} />;
    case "Space":
      return <BoxGroup node={props.element} />;
    case "Text":
      return <TextElement {...props.element} text={props.element.value} />;
    case "TimeSignature":
      return <TimeSignature node={props.element} />;
    case "Vibrato":
      return <Vibrato node={props.element} />;
  }
};
