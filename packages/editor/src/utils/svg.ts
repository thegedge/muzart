import { Box, Margins } from "@muzart/layout";
import { pick } from "lodash-es";
import { type CSSProperties, type SVGAttributes } from "react";

type HasBox = { box: Box };

//
// DOM Props
//

export const sizeProps = (box: Box): Partial<CSSProperties> => {
  return { width: `${box.width}in`, height: `${box.height}in` };
};

export const positionProps = (box: Box): Partial<CSSProperties> => {
  return { top: `${box.y}in`, left: `${box.x}in` };
};

export const boxProps = (box: Box): Partial<CSSProperties> => {
  return Object.assign(sizeProps(box), positionProps(box));
};

export const marginProps = (margins: Margins): Partial<CSSProperties> => {
  return {
    paddingLeft: `${margins.left}in`,
    paddingRight: `${margins.right}in`,
    paddingTop: `${margins.top}in`,
    paddingBottom: `${margins.bottom}in`,
  };
};

//
// SVG props
//

export const svgSizeProps = (box: Box | HasBox): Partial<Pick<SVGAttributes<SVGElement>, "width" | "height">> => {
  if ("box" in box) {
    box = box.box;
  }
  return { width: box.width, height: box.height };
};

export const svgPositionProps = (box: Box | HasBox): Partial<Pick<SVGAttributes<SVGElement>, "x" | "y">> => {
  if ("box" in box) {
    box = box.box;
  }
  return pick(box, "x", "y");
};

export const svgPositionTransform = (box: Box | HasBox): string => {
  if ("box" in box) {
    box = box.box;
  }
  return `translate(${box.x}, ${box.y})`;
};

export const svgBoxProps = (box: Box | HasBox) => {
  if ("box" in box) {
    box = box.box;
  }
  return Object.assign(svgSizeProps(box), svgPositionProps(box));
};
