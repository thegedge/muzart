import * as CSS from "csstype";
import { range } from "lodash";
import layout, { Box, DEFAULT_SERIF_FONT_FAMILY, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../layout";
import { renderScoreElement } from "./renderScoreElement";
import { RenderContext, RenderFunc } from "./types";

export const ChordDiagram: RenderFunc<layout.ChordDiagram> = (element, render, context) => {
  const textBox = new Box(element.box.x, element.box.y, element.box.width, STAFF_LINE_HEIGHT);

  let verticalAlign: CSS.Properties["verticalAlign"];
  if (element.diagram.diagram) {
    verticalAlign = "top";
  } else {
    verticalAlign = "bottom";
  }

  // TODO move this to layout
  renderScoreElement(
    {
      type: "Text",
      parent: null,
      size: STAFF_LINE_HEIGHT,
      box: textBox,
      text: element.diagram.name,
      style: {
        textAlign: "center",
        verticalAlign,
        fontFamily: DEFAULT_SERIF_FONT_FAMILY,
      },
    },
    render,
    context,
  );

  // TODO move this to layout
  const diagramBox = new Box(
    element.box.x,
    element.box.y + textBox.height,
    element.box.width,
    element.box.height - textBox.height,
  );
  FretboardDiagram(element, render, { ...context, box: diagramBox });
};

const FretboardDiagram = (
  element: layout.ChordDiagram,
  render: CanvasRenderingContext2D,
  context: RenderContext & { box: Box },
) => {
  const { application, box } = context;
  const numStrings = application.selection.part?.part?.instrument?.tuning?.length;
  if (!numStrings) {
    return null;
  }

  const diagram = element.diagram.diagram;
  if (!diagram) {
    return null;
  }

  const textSize = element.textSize;
  const numFrets = 5; // TODO make this configurable
  const fretboardH = box.height - 1.5 * STAFF_LINE_HEIGHT;
  const fretW = box.width / (numStrings - 1);
  const fretH = fretboardH / numFrets;
  const fretY = box.y + textSize;

  const openUnplayed = diagram.frets.slice(0, numStrings);
  diagram.barres.forEach((barre) => {
    openUnplayed.fill(1, barre.firstString, barre.lastString + 1);
  });

  // // TODO enable this once chord diagrams can influence the width of chords. Not enough width at the moment.
  // if (diagram.baseFret > 1) {
  //   renderScoreElement(
  //     {
  //       type: "Text",
  //       parent: null,
  //       text: diagram.baseFret.toString(),
  //       box: new Box(box.x - textSize + 2 * LINE_STROKE_WIDTH, fretY, textSize, textSize),
  //       size: textSize,
  //       style: {
  //         textAlign: "center",
  //         verticalAlign: "center",
  //       },
  //     },
  //     render,
  //     context,
  //   );
  // }

  // The lines forming the fretboard + the nut
  render.beginPath();
  render.strokeStyle = "#000000";
  render.fillStyle = "#000000";
  {
    render.lineWidth = LINE_STROKE_WIDTH * (diagram.baseFret == 1 ? 5 : 1);
    render.moveTo(box.x - 0.5 * LINE_STROKE_WIDTH, fretY);
    render.lineTo(box.right + 0.5 * LINE_STROKE_WIDTH, fretY);
    render.stroke();

    render.lineWidth = LINE_STROKE_WIDTH;
    range(1, numFrets + 1).forEach((fret) => {
      render.moveTo(box.x, fretY + fretH * fret);
      render.lineTo(box.right, fretY + fretH * fret);
    });

    range(numStrings).forEach((string) => {
      render.moveTo(box.x + fretW * string, fretY);
      render.lineTo(box.x + fretW * string, fretY + fretboardH);
    });
  }
  render.stroke();

  openUnplayed.forEach((v, index) => {
    let text;
    let height = STAFF_LINE_HEIGHT;
    switch (v) {
      case undefined:
      case -1: {
        text = "×";
        break;
      }
      case 0: {
        height *= 0.94; // this character is set a little lower, so bring it up some to align nicely with the '×'
        text = "○";
        break;
      }
      default: {
        return;
      }
    }

    // TODO move this to layout
    renderScoreElement(
      {
        type: "Text",
        parent: null,
        box: new Box(box.x + (numStrings - index - 1.5) * fretW, box.y, fretW, height),

        size: textSize,
        text: text,
        style: {
          textAlign: "center",
          verticalAlign: "bottom",
          fontFamily: DEFAULT_SERIF_FONT_FAMILY,
        },
      },
      render,
      context,
    );
  });

  diagram.frets.forEach((fret, index) => {
    if (fret && fret > 0) {
      const cx = box.x + (numStrings - index - 1) * fretW;
      const cy = fretY + (fret - diagram.baseFret + 0.5) * fretH;
      render.moveTo(cx, cy);
      render.ellipse(cx, cy, 0.3 * fretW, 0.3 * fretW, 0, 0, 2 * Math.PI);
    }
  });

  diagram.barres.forEach((barre) => {
    const startX = (numStrings - barre.firstString - 1) * fretW;
    const endX = (numStrings - barre.lastString - 1) * fretW;
    const y = fretY + (barre.baseFret - diagram.baseFret + 0.5) * fretH;

    render.moveTo(box.x + startX, y);
    render.ellipse(box.x + startX, y, 0.3 * fretW, 0.3 * fretW, 0, 0, 2 * Math.PI);

    render.moveTo(box.x + endX, y);
    render.ellipse(box.x + endX, y, 0.3 * fretW, 0.3 * fretW, 0, 0, 2 * Math.PI);

    const rx = box.x + endX;
    const ry = y - 0.3 * fretW;
    render.moveTo(rx, ry);
    render.lineTo(rx + startX - endX, ry);
    render.lineTo(rx + startX - endX, ry + 0.6 * fretW);
    render.lineTo(rx, ry + 0.6 * fretW);
    render.lineTo(rx, ry);
  });

  render.fill();
  render.closePath();
};
