import React from "react";
import { useWriteSelection } from "../utils/SelectionContext";
import { BoxGroup, BoxGroupProps } from "./BoxGroup";

export function SelectableBoxGroup(props: BoxGroupProps) {
  const { updateSelectionFor } = useWriteSelection();

  let onClick;
  if (props.onClick) {
    onClick = (event: React.MouseEvent<SVGGElement>) => {
      props.onClick!(event);
      updateSelectionFor(props.node);
    };
  } else {
    onClick = () => updateSelectionFor(props.node);
  }

  return <BoxGroup {...props} onClick={onClick} />;
}
