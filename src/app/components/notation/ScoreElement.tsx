import React from "react";
import { LineElement, LINE_STROKE_WIDTH, PageElement } from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";
import { Arc } from "./Arc";
import { BarLine } from "./BarLine";
import { Beam } from "./Beam";
import { Bend } from "./Bend";
import { Chord } from "./Chord";
import { DashedLineText } from "./DashedLineText";
import { Dot } from "./Dot";
import { Measure } from "./Measure";
import { Rest } from "./Rest";
import { Slide } from "./Slide";
import { Stem } from "./Stem";
import { TextElement } from "./TextElement";
import { Vibrato } from "./Vibrato";
import { WrappedElement } from "./WrappedElement";

export default function ScoreElement(props: { element: PageElement | LineElement }): React.ReactElement {
  switch (props.element.type) {
    case "Arc":
      return <Arc element={props.element} />;
    case "BarLine":
      return <BarLine node={props.element} />;
    case "Bend":
      return <Bend node={props.element} />;
    case "Beam":
      return <Beam node={props.element} />;
    case "Chord":
      return <Chord chord={props.element} />;
    case "ChordDiagram":
      return <BoxGroup node={props.element} forceDebug />;
    case "DashedLineText":
      return <DashedLineText element={props.element} />;
    case "Dot":
      return <Dot node={props.element} />;
    case "Group":
      return (
        <BoxGroup node={props.element}>
          {props.element.elements.map((e, index) => (
            <ScoreElement key={index} element={e} />
          ))}
        </BoxGroup>
      );
    case "Line":
      return (
        <>
          <BoxGroup node={props.element} forceDebug />
          <line
            x1={props.element.box.x}
            y1={props.element.box.y}
            x2={props.element.box.right}
            y2={props.element.box.bottom}
            strokeWidth={LINE_STROKE_WIDTH}
            stroke={props.element.color}
          />
        </>
      );
    case "Measure":
      return <Measure measure={props.element} />;
    case "Rest":
      return <Rest node={props.element} />;
    case "Slide":
      return <Slide node={props.element} />;
    case "Space":
      return <BoxGroup node={props.element} />;
    case "Stem":
      return <Stem node={props.element} />;
    case "Text":
      return <TextElement {...props.element} text={props.element.value} />;
    case "Vibrato":
      return <Vibrato node={props.element} />;
    case "Wrapped":
      return <WrappedElement node={props.element} />;
  }
}
