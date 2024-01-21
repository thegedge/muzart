import { AnyLayoutElement, Box, HasBox, MaybeLayout } from "../src/layout";

import { Axis } from "../src/layout/layouts/FlexGroup";

export type LayoutFn = Exclude<MaybeLayout["layout"], undefined>;

export const elem = (
  x: number,
  y: number,
  w: number,
  h: number,
  options?: { parent?: AnyLayoutElement; type?: string; layout?: LayoutFn },
) => {
  return {
    type: options?.type ?? "Child",
    box: new Box(x, y, w, h),
    parent: options?.parent ?? null,
    layout: options?.layout,
  };
};

export const size = (elem: HasBox, axis: Axis) => {
  switch (axis) {
    case "horizontal":
      return elem.box.width;
    case "vertical":
      return elem.box.height;
  }
};

export const start = (elem: HasBox, axis: Axis) => {
  switch (axis) {
    case "horizontal":
      return elem.box.x;
    case "vertical":
      return elem.box.y;
  }
};

export const end = (elem: HasBox, axis: Axis) => {
  switch (axis) {
    case "horizontal":
      return elem.box.right;
    case "vertical":
      return elem.box.bottom;
  }
};

export function* adjacent<T>(array: T[]): Generator<[T, T]> {
  for (let index = 1; index < array.length; ++index) {
    yield [array[index - 1], array[index]];
  }
}
