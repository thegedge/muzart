import { pick } from "lodash";
import { CSSProperties, SVGAttributes } from "react";
import { Box, Margins, Positioned, Sized } from "../layout";

//
// DOM Props
//

export function sizeProps(sized: Sized): Partial<CSSProperties> {
  return { width: `${sized.width}in`, height: `${sized.height}in` };
}

export function positionProps(positioned: Positioned): Partial<CSSProperties> {
  return { top: `${positioned.y}in`, left: `${positioned.x}in` };
}

export function boxProps(box: Box): Partial<CSSProperties> {
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

export function svgPositionProps(positioned: Positioned): Partial<SVGAttributes<SVGElement>> {
  return pick(positioned, "x", "y");
}

export function svgPositionTransform(positioned: Positioned): string {
  return `translate(${positioned.x}, ${positioned.y})`;
}

export function svgBoxProps(box: Box): Partial<SVGAttributes<SVGElement>> {
  return Object.assign(svgSizeProps(box), svgPositionProps(box));
}
