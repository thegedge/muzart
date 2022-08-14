import { action, makeObservable, observable } from "mobx";
import { JSX } from "react";
import { LINE_STROKE_WIDTH } from "../../layout";

type DebugParams = Pick<JSX.SVGAttributes, "stroke" | "strokeDasharray" | "strokeWidth" | "fill">;

export class DebugContext {
  public enabled = import.meta.env.VITE_DEBUG_APP == "1";

  private index = 0;
  private colorMap = new Map<string, DebugParams>();

  constructor() {
    makeObservable(this, {
      enabled: observable,
      setEnabled: action,
    });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  paramsForType(type: string): DebugParams {
    // TODO make it possible to configure this elsewhere
    // if (type !== "Measure" && type != "TimeSignature") {
    //   return {
    //     fill: "none",
    //   };
    // }

    let params = this.colorMap.get(type);
    if (!params) {
      const index = this.index++;
      const bucketCycle = Math.floor(index / BUCKETS.length);
      const bucket = BUCKETS[index % BUCKETS.length];
      const hue = bucket + Math.floor(20 * (Math.random() - 0.5));
      const saturation = 50 + Math.floor(20 * Math.random());
      const lightness = 50 + Math.floor(10 * Math.random());
      params = {
        stroke: `hsl(${hue}deg, ${saturation}%, ${lightness}%)`,
        strokeDasharray: DASHES[bucketCycle % DASHES.length],
        strokeWidth: LINE_STROKE_WIDTH * 1.5,
        fill: "none",
      };
      this.colorMap.set(type, params);
    }

    return params;
  }
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
