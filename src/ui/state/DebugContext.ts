import { action, makeObservable, observable } from "mobx";
import { LINE_STROKE_WIDTH } from "../../layout";

interface DebugParams {
  strokeStyle: string | CanvasGradient | CanvasPattern;
  fillStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  dashArray: number[];
}

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

  paramsForType(type: string): DebugParams | null {
    // TODO make it possible to configure this elsewhere
    // if (type !== "PageContent" && type !== "PageLine") {
    //   return null;
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
        strokeStyle: `hsl(${hue}deg, ${saturation}%, ${lightness}%)`,
        dashArray: DASHES[bucketCycle % DASHES.length],
        lineWidth: LINE_STROKE_WIDTH * 1.5,
        fillStyle: "",
      };
      this.colorMap.set(type, params);
    }

    return params;
  }
}

const BUCKETS = [0, 225, 90, 180, 315, 135, 45, 270];

const DASHES: DebugParams["dashArray"][] = [
  // Solid
  [],

  // Dashes
  [LINE_STROKE_WIDTH * 5, LINE_STROKE_WIDTH],

  // Dots
  [LINE_STROKE_WIDTH, LINE_STROKE_WIDTH * 2],

  // Dash-dot
  [LINE_STROKE_WIDTH * 5, LINE_STROKE_WIDTH * 2, LINE_STROKE_WIDTH, LINE_STROKE_WIDTH * 2],
];
