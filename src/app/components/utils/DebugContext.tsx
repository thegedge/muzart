import { isNil } from "lodash";
import { createContext, CSSProperties, useContext } from "react";
import { LINE_STROKE_WIDTH } from "../../layout";

export type DebugParams = Pick<CSSProperties, "stroke" | "strokeDasharray" | "strokeWidth" | "fill">;
export type DebugContextData = { enabled: boolean; index: number; colorMap: Record<string, DebugParams | null> };

export const DebugContext = createContext<DebugContextData>({
  enabled: process.env.DEBUG === "1",
  index: 0,
  colorMap: {},
});

export function useDebugRectParams(type: string | undefined, force?: boolean) {
  const debug = useContext(DebugContext);

  let debugColor = null;
  const debugType = type || "undefined";
  if (force || debug.enabled) {
    debugColor = debug.colorMap[debugType];
    if (isNil(debugColor)) {
      debugColor = debug.colorMap[debugType] = nextParams(debug.index);
      debug.index += 1;
    }
  }

  return debugColor;
}

const BUCKETS = [0, 225, 90, 180, 315, 135, 45, 270];

const DASHES = [
  // Dashes, equal size
  `${LINE_STROKE_WIDTH * 5} ${LINE_STROKE_WIDTH}`,

  // Dots
  `${LINE_STROKE_WIDTH} ${LINE_STROKE_WIDTH * 2}`,

  // Dash-dot
  `${LINE_STROKE_WIDTH * 5} ${LINE_STROKE_WIDTH * 2} ${LINE_STROKE_WIDTH} ${LINE_STROKE_WIDTH * 2}`,
];

function nextParams(index: number): DebugParams {
  const bucketCycle = Math.floor(index / BUCKETS.length);
  const bucket = BUCKETS[index % BUCKETS.length];
  const hue = bucket + Math.floor(20 * (Math.random() - 0.5));
  const saturation = 50 + Math.floor(20 * Math.random());
  const lightness = 50 + Math.floor(10 * Math.random());
  return {
    stroke: `hsl(${hue}deg, ${saturation}%, ${lightness}%)`,
    strokeDasharray: DASHES[bucketCycle % DASHES.length],
    strokeWidth: LINE_STROKE_WIDTH * 1.5,
    fill: "none",
  };
}
