import React from "react";
import { LineElement } from "../../layout";
import { Arc } from "./Arc";
import { BarLine } from "./BarLine";
import { Beam } from "./Beam";
import { DashedLineText } from "./DashedLineText";
import { Dot } from "./Dot";
import { LineGroup } from "./LineGroup";
import { Measure } from "./Measure";
import { Stem } from "./Stem";
import { TextElement } from "./TextElement";
import { WrappedElement } from "./WrappedElement";

export default function LineElementComponent(props: { element: LineElement }): React.ReactElement {
  switch (props.element.type) {
    case "Arc":
      return <Arc element={props.element} />;
    case "BarLine":
      return <BarLine node={props.element} />;
    case "Beam":
      return <Beam node={props.element} />;
    case "DashedLineText":
      return <DashedLineText element={props.element} />;
    case "Dot":
      return <Dot node={props.element} />;
    case "Group":
      return <LineGroup node={props.element} />;
    case "Measure":
      return <Measure measure={props.element} />;
    case "Space":
      return <></>;
    case "Stem":
      return <Stem node={props.element} />;
    case "Text":
      return <TextElement {...props.element} text={props.element.value} />;
    case "Wrapped":
      return <WrappedElement node={props.element} />;
  }
}
