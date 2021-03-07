import { pick } from "lodash";
import { CSSProperties, SVGAttributes } from "react";
import { Boxed, Margins, Positioned, Sized } from "../layout";

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

export function svgSizeProps(sized: Sized): Partial<SVGAttributes<SVGElement>> {
  return { width: `${sized.width}in`, height: `${sized.height}in` };
}

export function svgPositionProps(positioned: Positioned | { box: Positioned }): Partial<SVGAttributes<SVGElement>> {
  if ("box" in positioned) {
    positioned = positioned.box;
  }
  return pick(positioned, "x", "y");
}

export function svgPositionTransform(positioned: Positioned | { box: Positioned }): string {
  if ("box" in positioned) {
    positioned = positioned.box;
  }
  return `translate(${positioned.x}, ${positioned.y})`;
}

export function svgBoxProps(box: Boxed | { box: Boxed }): Partial<SVGAttributes<SVGElement>> {
  if ("box" in box) {
    box = box.box;
  }
  return Object.assign(svgSizeProps(box), svgPositionProps(box));
}
