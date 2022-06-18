import { observer } from "mobx-react-lite";
import React from "react";
import { useApplicationState } from "../utils/ApplicationStateContext";
import { BoxGroup, BoxGroupProps } from "./BoxGroup";

export const SelectableBoxGroup = observer((props: BoxGroupProps) => {
  const { onClick: onClickProp } = props;
  const { selection } = useApplicationState();

  let onClick;
  if (onClickProp) {
    onClick = (event: React.MouseEvent<SVGGElement>) => {
      onClickProp(event);
      selection.setFor(props.node);
    };
  } else {
    onClick = () => selection.setFor(props.node);
  }

  return <BoxGroup {...props} onClick={onClick} />;
});
