import React from "react";
import { LineElement } from "../../layout";
import { BarLine } from "./BarLine";
import { Beam } from "./Beam";
import { LineGroup } from "./LineGroup";
import { Measure } from "./Measure";
import { Stem } from "./Stem";
import { TextElement } from "./TextElement";

const STEM_BEAM_COLOR = "#333333";

export default function LineElementComponent(props: { element: LineElement }): React.ReactElement {
  switch (props.element.type) {
    case "BarLine":
      return <BarLine node={props.element} />;
    case "Beam":
      return <Beam node={props.element} />;
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
  }
}
