import layout, { Box, LINE_STROKE_WIDTH, TextDecoration } from "../layout";
import { RenderFunc } from "./types";

export const DecoratedText: RenderFunc<layout.DecoratedText> = (element, render, _context) => {
  // TODO use `measureText`, just need to map to user space

  const textWidth = element.text.length * element.size * 0.6;
  const textHeight = element.size;
  const textMargin = LINE_STROKE_WIDTH * 5;

  if (textWidth + textMargin < element.box.width) {
    // TODO move to CSS, don't interfere with text above
    render.strokeStyle = element.style?.color || "#333333";

    switch (element.style?.textAlign) {
      case undefined:
      case "left":
        element.decorations.end &&
          drawDecoration(
            render,
            element.decorations.end,
            element.box.update({
              x: element.box.x + textWidth,
              y: element.box.centerY - 0.5 * textHeight,
              width: element.box.width - textWidth - textMargin,
              height: textHeight,
            }),
          );
        break;
      case "right":
        element.decorations.start &&
          drawDecoration(
            render,
            element.decorations.start,
            element.box.update({
              x: element.box.x,
              y: element.box.centerY - 0.5 * textHeight,
              width: element.box.width - textWidth - textMargin,
              height: textHeight,
            }),
            true,
          );
        break;
      case "center":
        element.decorations.start &&
          drawDecoration(
            render,
            element.decorations.start,
            element.box.update({
              x: element.box.x,
              y: element.box.centerY - 0.5 * textHeight,
              width: 0.5 * (element.box.width - textWidth) - textMargin,
              height: textHeight,
            }),
            true,
          );

        element.decorations.end &&
          drawDecoration(
            render,
            element.decorations.end,
            element.box.update({
              x: element.box.centerX + 0.5 * textWidth + textMargin,
              y: element.box.centerY - 0.5 * textHeight,
              width: 0.5 * (element.box.width - textWidth) - textMargin,
              height: textHeight,
            }),
          );
        break;
    }
  }
};

const drawDecoration = (
  context: CanvasRenderingContext2D,
  decoration: TextDecoration,
  box: Box,
  tickOnLeft = false,
) => {
  context.beginPath();
  if (decoration.dashed) {
    context.setLineDash([12 * LINE_STROKE_WIDTH, 4 * LINE_STROKE_WIDTH]);
  }
  context.moveTo(box.x, box.centerY);
  context.lineTo(box.right, box.centerY);
  context.stroke();

  if (decoration.dashed) {
    context.setLineDash([]);
  }

  const tickX = tickOnLeft ? box.x : box.right;
  if (decoration.upTick && decoration.downTick) {
    context.moveTo(tickX, box.y);
    context.lineTo(tickX, box.bottom);
  } else if (decoration.downTick) {
    context.moveTo(tickX, box.centerY);
    context.lineTo(tickX, box.bottom);
  } else if (decoration.upTick) {
    context.moveTo(tickX, box.y);
    context.lineTo(tickX, box.centerY);
  }

  context.stroke();
  context.closePath();
};
