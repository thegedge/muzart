import { ComponentChildren } from "preact";
import { Box, DEFAULT_SANS_SERIF_FONT_FAMILY, LINE_STROKE_WIDTH } from "../../../layout";

export const SvgRoot = (props: { box: Box; children?: ComponentChildren }) => {
  const box = props.box;
  return (
    <svg
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      style={{
        width: `${box.width}mm`,
        height: `${box.height}mm`,
      }}
      className="m-auto"
      fontFamily={DEFAULT_SANS_SERIF_FONT_FAMILY}
      shapeRendering="geometricPrecision"
      stroke="transparent"
      strokeWidth={LINE_STROKE_WIDTH}
      textRendering="optimizeSpeed"
    >
      <defs>
        <filter id="pageShadow">
          <feDropShadow
            dx={LINE_STROKE_WIDTH * 0}
            dy={LINE_STROKE_WIDTH * 0}
            stdDeviation={LINE_STROKE_WIDTH * 10}
            floodOpacity="0.25"
          />
        </filter>

        <filter id="pageBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation={5 * LINE_STROKE_WIDTH} />
        </filter>
      </defs>
      {props.children}
    </svg>
  );
};
