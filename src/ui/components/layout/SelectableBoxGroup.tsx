import { observer } from "mobx-react-lite";
import React from "react";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { BoxGroup, BoxGroupProps } from "./BoxGroup";

export const SelectableBoxGroup = observer((props: BoxGroupProps) => {
  const { onClick: onClickProp } = props;
  const { selection } = useApplicationState();

  const onClick = (event: React.MouseEvent<SVGGElement>) => {
    selection.setFor(props.node);
    onClickProp?.(event);
  };

  return <BoxGroup {...props} onClick={onClick} />;
});
