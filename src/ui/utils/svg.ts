import { pick } from "lodash";
import { CSSProperties, SVGAttributes } from "react";
import { HasBox, Margins } from "../../layout/types";
import { Box } from "../../layout/utils/Box";

//
// DOM Props
//

export function sizeProps(box: Box): Partial<CSSProperties> {
  return { width: `${box.width}in`, height: `${box.height}in` };
}

export function positionProps(box: Box): Partial<CSSProperties> {
  return { top: `${box.y}in`, left: `${box.x}in` };
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

export function svgSizeProps(box: Box | HasBox): Partial<SVGAttributes<SVGElement>> {
  if ("box" in box) {
    box = box.box;
  }
  return { width: box.width, height: box.height };
}

export function svgPositionProps(box: Box | HasBox): Partial<SVGAttributes<SVGElement>> {
  if ("box" in box) {
    box = box.box;
  }
  return pick(box, "x", "y");
}

export function svgPositionTransform(box: Box | HasBox): string {
  if ("box" in box) {
    box = box.box;
  }
  return `translate(${box.x}, ${box.y})`;
}

export function svgBoxProps(box: Box | HasBox): Partial<SVGAttributes<SVGElement>> {
  if ("box" in box) {
    box = box.box;
  }
  return Object.assign(svgSizeProps(box), svgPositionProps(box));
}
