import { Box, Margins } from "@muzart/layout";
import { pick } from "lodash";
import { JSXInternal } from "preact/src/jsx";

type HasBox = { box: Box };

//
// DOM Props
//

export const sizeProps = (box: Box): Partial<JSXInternal.CSSProperties> => {
  return { width: `${box.width}in`, height: `${box.height}in` };
};

export const positionProps = (box: Box): Partial<JSXInternal.CSSProperties> => {
  return { top: `${box.y}in`, left: `${box.x}in` };
};

export const boxProps = (box: Box): Partial<JSXInternal.CSSProperties> => {
  return Object.assign(sizeProps(box), positionProps(box));
};

export const marginProps = (margins: Margins): Partial<JSXInternal.CSSProperties> => {
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

export const svgSizeProps = (box: Box | HasBox): Partial<Pick<JSXInternal.SVGAttributes, "width" | "height">> => {
  if ("box" in box) {
    box = box.box;
  }
  return { width: box.width, height: box.height };
};

export const svgPositionProps = (box: Box | HasBox): Partial<Pick<JSXInternal.SVGAttributes, "x" | "y">> => {
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
