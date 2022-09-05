import { observer } from "mobx-react-lite";
import React, { useMemo } from "react";
import { Box } from "../../../layout";
import { useApplicationState } from "../../utils/ApplicationStateContext";

export const DebugBox = observer((props: { box: Box; debugType: string }) => {
  const { debug } = useApplicationState();
  if (!debug.enabled) {
    return null;
  }

  const debugParams = useMemo(() => debug.paramsForType(props.debugType), [props.debugType]);
  return <rect x={0} y={0} width={props.box.width} height={props.box.height} {...debugParams} />;
});
