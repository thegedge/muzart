import React from "react";
import * as layout from "../../../layout";
import { STAFF_LINE_HEIGHT } from "../../../layout";
import { Rests } from "../../resources/rests";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { SelectableBoxGroup } from "../layout/SelectableBoxGroup";

const REST_COLOR = "#333333";

export const Rest = (props: { element: layout.Rest }) => {
  const icon = Rests[props.element.chord.value.name];
  if (!icon) {
    return null;
  }

  // TODO with a properly sized box, we should be able to place these without needing the selection
  const { selection } = useApplicationState();
  const offset = ((selection.part?.part.instrument?.tuning?.length ?? 6) - 1) / 2;

  return (
    <SelectableBoxGroup element={props.element} scale={STAFF_LINE_HEIGHT}>
      <g transform={`translate(0 ${offset})`}>{React.cloneElement(icon, { fill: REST_COLOR })}</g>
    </SelectableBoxGroup>
  );
};
