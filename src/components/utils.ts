import { pick } from "lodash";
import { CSSProperties, SVGAttributes } from "react";
import { Boxed, HasBox, Margins, Positioned, Sized } from "../layout/types";

//
// DOM Props
//

export function sizeProps(sized: Sized): Partial<CSSProperties> {
  return { width: `${sized.width}in`, height: `${sized.height}in` };
}

export function positionProps(positioned: Positioned): Partial<CSSProperties> {
  return { top: `${positioned.y}in`, left: `${positioned.x}in` };
}

export function boxProps(box: Boxed): Partial<CSSProperties> {
  return Object.assign(sizeProps(box), positionProps(box));
}

export function marginProps(margins: Margins): Partial<CSSProperties> {
  return {
    paddingLeft: `${margins.left}in`,
    paddingRight: `${margins.right}in`,
    paddingTop: `${margins.top}in`,
    paddingBottom: `${margins.bottom}in`,
  };
}

//
// SVG props
//

export function svgSizeProps(sized: Sized | HasBox): Partial<SVGAttributes<SVGElement>> {
  if ("box" in sized) {
    sized = sized.box;
  }
  return { width: sized.width, height: sized.height };
}

export function svgPositionProps(positioned: Positioned | HasBox): Partial<SVGAttributes<SVGElement>> {
  if ("box" in positioned) {
    positioned = positioned.box;
  }
  return pick(positioned, "x", "y");
}

export function svgPositionTransform(positioned: Positioned | HasBox): string {
  if ("box" in positioned) {
    positioned = positioned.box;
  }
  return `translate(${positioned.x}, ${positioned.y})`;
}

export function svgBoxProps(box: Boxed | HasBox): Partial<SVGAttributes<SVGElement>> {
  if ("box" in box) {
    box = box.box;
  }
  return Object.assign(svgSizeProps(box), svgPositionProps(box));
}
