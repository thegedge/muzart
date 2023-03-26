import { Box, MaybeLayout } from "../src/layout";

export type LayoutFn = Exclude<MaybeLayout["layout"], undefined>;

export const elem = (x: number, y: number, w: number, h: number, layout?: LayoutFn) => {
  return {
    type: "Child",
    box: new Box(x, y, w, h),
    parent: null,
    layout,
  };
};
