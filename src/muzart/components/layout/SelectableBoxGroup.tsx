import { observer } from "mobx-react-lite";
import React from "react";
import { useApplicationState } from "../state/ApplicationStateContext";
import { BoxGroup, BoxGroupProps } from "./BoxGroup";

export const SelectableBoxGroup = observer((props: BoxGroupProps) => {
  const { onClick: onClickProp } = props;
  const { selection } = useApplicationState();

  const onClick = (event: React.MouseEvent<SVGGElement>) => {
    onClickProp?.(event);
    selection.setFor(props.node);
  };

  return <BoxGroup {...props} onClick={onClick} />;
});
