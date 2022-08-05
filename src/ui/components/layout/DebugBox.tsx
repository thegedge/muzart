import { observer } from "mobx-react-lite";
import React, { useMemo } from "react";
import { Box } from "../../../layout";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { svgBoxProps } from "../../utils/svg";

export const DebugBox = observer(function DebugBox(props: { box: Box; debugType: string }) {
  const { debug } = useApplicationState();
  const debugParams = useMemo(() => debug.paramsForType(props.debugType), [props.debugType]);
  return <rect {...svgBoxProps(props.box)} {...debugParams} visibility={debug.enabled ? undefined : "hidden"} />;
});
