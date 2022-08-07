import { autorun } from "mobx";
import React, { useEffect, useMemo, useRef } from "react";
import { Box } from "../../../layout";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { svgBoxProps } from "../../utils/svg";

export const DebugBox = (props: { box: Box; debugType: string }) => {
  const { debug } = useApplicationState();
  const debugParams = useMemo(() => debug.paramsForType(props.debugType), [props.debugType]);
  const ref = useRef<SVGRectElement>(null);

  useEffect(() => {
    return autorun(() => {
      const visibility = debug.enabled ? "visible" : "hidden";
      ref.current?.setAttribute("visibility", visibility);
    });
  }, [ref]);

  return <rect ref={ref} {...svgBoxProps(props.box)} {...debugParams} visibility="hidden" />;
};

DebugBox.displayName = "DebugBox";
