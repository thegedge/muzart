import { isNil } from "lodash";
import { createContext, useContext } from "react";

export type DebugContextData = { enabled: boolean; index: number; colorMap: Record<string, string | null> };

export const DebugContext = createContext<DebugContextData>({
  enabled: process.env.DEBUG === "1",
  index: 0,
  colorMap: {},
});

export function useDebugColorFor(type: string | undefined, force?: boolean) {
  const debug = useContext(DebugContext);

  let debugColor = null;
  const debugType = type || "undefined";
  if (force || debug.enabled) {
    debugColor = debug.colorMap[debugType];
    if (isNil(debugColor)) {
      debugColor = debug.colorMap[debugType] = newColor(debug.index);
      debug.index += 1;
    }
  }

  return debugColor;
}

const BUCKETS = [0, 225, 90, 180, 315, 135, 45, 270];

function newColor(index: number) {
  const bucket = BUCKETS[index % BUCKETS.length];
  const hue = bucket + Math.floor(20 * (Math.random() - 0.5));
  const saturation = 50 + Math.floor(20 * Math.random());
  const lightness = 50 + Math.floor(10 * Math.random());
  return `hsl(${hue}deg, ${saturation}%, ${lightness}%)`;
}
