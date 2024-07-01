import { LayoutElement, type AnyLayoutElement } from "../src/elements/LayoutElement";
import type { Axis } from "../src/layouts/FlexGroup";
import { Box } from "../src/utils/Box";

export type LayoutFn = AnyLayoutElement["layout"];

export type HasBox = { box: Box };

class TestChild extends LayoutElement<string> {
  constructor(
    readonly type: string,
    box: Box,
    parent: AnyLayoutElement | null,
    layout?: LayoutFn,
  ) {
    super(box);

    this.parent = parent;

    if (layout) {
      this.layout = layout;
    }
  }
}

export const elem = (
  x: number,
  y: number,
  w: number,
  h: number,
  options?: { parent?: AnyLayoutElement; type?: string; layout?: LayoutFn },
) => {
  return new TestChild(options?.type ?? "Child", new Box(x, y, w, h), options?.parent ?? null, options?.layout);
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

export function* adjacent<T>(array: T[]) {
  for (let index = 1; index < array.length; ++index) {
    yield [array[index - 1], array[index]] as const;
  }
}
