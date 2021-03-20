import { isNil } from "lodash";
import React, { useContext } from "react";
import { HasBox } from "../layout";
import { svgPositionTransform, svgSizeProps } from "./utils";

const DebugContext = React.createContext<{ enabled: boolean; index: number; colorMap: Record<string, string | null> }>({
  enabled: process.env.DEBUG === "1",
  index: 0,
  colorMap: {},
});

const BUCKETS = [0, 225, 90, 180, 315, 135, 45, 270];

export function BoxGroup(props: { node: HasBox & { type?: string }; debug?: boolean; children: React.ReactNode }) {
  const debug = useContext(DebugContext);
  let debugColor = null;
  const debugType = props.node.type || "undefined";
  if (props.debug || debug.enabled || debugType in debug.colorMap) {
    debugColor = debug.colorMap[debugType];
    if (isNil(debugColor)) {
      debugColor = debug.colorMap[debugType] = newColor(debug.index);
      debug.index += 1;
    }
  }

  return (
    <g transform={svgPositionTransform(props.node)}>
      {props.children}
      {debugColor && <rect {...svgSizeProps(props.node)} fill="none" stroke={debugColor} strokeWidth={0.01} />}
    </g>
  );
}

function newColor(index: number) {
  const bucket = BUCKETS[index % BUCKETS.length];
  const hue = bucket + Math.floor(20 * (Math.random() - 0.5));
  const saturation = 50 + Math.floor(20 * Math.random());
  const lightness = 50 + Math.floor(10 * Math.random());
  return `hsl(${hue}deg, ${saturation}%, ${lightness}%)`;
}
