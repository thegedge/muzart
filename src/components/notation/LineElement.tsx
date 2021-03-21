import React from "react";
import { LineElement } from "../../layout";
import { BarLine } from "./BarLine";
import { LineGroup } from "./LineGroup";
import { Measure } from "./Measure";
import { StemBeam } from "./StemBeam";
import { TextElement } from "./TextElement";

export default function LineElementComponent(props: { element: LineElement }): React.ReactElement {
  switch (props.element.type) {
    case "BarLine":
      return <BarLine node={props.element} />;
    case "DurationStem":
      return <StemBeam node={props.element} />;
    case "Group":
      return <LineGroup node={props.element} />;
    case "Measure":
      return <Measure measure={props.element} />;
    case "Space":
      return <></>;
    case "Text":
      return <TextElement {...props.element} text={props.element.value} />;
  }
}
