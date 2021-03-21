import React from "react";
import { LineElement } from "../../layout";
import { BarLine } from "./BarLine";
import { LineGroup } from "./LineGroup";
import { Measure } from "./Measure";
import { StemBeam } from "./StemBeam";
import { TextElement } from "./TextElement";

export default function LineElementComponent(props: { element: LineElement }) {
  switch (props.element.type) {
    case "Group":
      return <LineGroup node={props.element} />;
    case "Text":
      return <TextElement {...props.element} text={props.element.value} />;
    case "Measure":
      return <Measure measure={props.element} />;
    case "BarLine":
      return <BarLine node={props.element} />;
    case "DurationStem":
      return <StemBeam node={props.element} />;
    default:
      return <></>;
  }
}
