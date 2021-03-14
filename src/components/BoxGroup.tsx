import React, { useContext } from "react";
import { HasBox } from "../layout";
import { svgPositionTransform, svgSizeProps } from "./utils";

const DebugContext = React.createContext<{ enabled: boolean; index: number; colorMap: Record<string, string | null> }>({
  enabled: process.env.DEBUG === "1",
  index: 0,
  colorMap: {},
});

const BUCKETS = [0, 225, 90, 180, 315, 135, 45, 270];

export function BoxGroup(props: { node: HasBox & { type?: string }; children: React.ReactNode }) {
  const debug = useContext(DebugContext);
  let debugColor = null;
  if (debug.enabled) {
    const newColor = () => {
      const bucket = BUCKETS[debug.index % BUCKETS.length];
      const hue = bucket + Math.floor(20 * (Math.random() - 0.5));
      const saturation = 50 + Math.floor(20 * Math.random());
      const lightness = 50 + Math.floor(10 * Math.random());
      debug.index += 1;
      return `hsl(${hue}deg, ${saturation}%, ${lightness}%)`;
    };

    debugColor = debug.colorMap[props.node.type || "undefined"];
    if (debugColor === undefined) {
      debugColor = debug.colorMap[props.node.type || "undefined"] = newColor();
    }
  }

  return (
    <g transform={svgPositionTransform(props.node)}>
      {props.children}
      {debugColor && <rect {...svgSizeProps(props.node)} fill="none" stroke={debugColor} strokeWidth={0.01} />}
    </g>
  );
}
