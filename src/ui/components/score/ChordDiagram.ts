import { range } from "lodash";
import layout, { DEFAULT_SERIF_FONT_FAMILY, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../../layout";
import { Box } from "../../../layout/utils/Box";
import { Application } from "../../state/Application";
import { Text } from "./Text";

// TODO have ChordDiagram just be FretboardDiagram, and have layout use a group to show other text elements

export const ChordDiagram = (
  application: Application,
  context: CanvasRenderingContext2D,
  element: layout.ChordDiagram
) => {
  const textBox = new Box(element.box.x, element.box.y, element.box.width, STAFF_LINE_HEIGHT);

  let valign: layout.Alignment;
  if (element.diagram.diagram) {
    valign = "start";
  } else {
    valign = "end";
  }

  Text(application, context, {
    size: STAFF_LINE_HEIGHT,
    box: textBox,
    text: element.diagram.name,
    halign: "center",
    valign,
    style: {
      fontFamily: DEFAULT_SERIF_FONT_FAMILY,
    },
  });

  const diagramBox = new Box(
    element.box.x,
    element.box.y + STAFF_LINE_HEIGHT,
    element.box.width,
    element.box.height - textBox.height
  );
  context.translate(0, textBox.height);
  FretboardDiagram(application, context, element, diagramBox);
};

const FretboardDiagram = (
  application: Application,
  context: CanvasRenderingContext2D,
  chordDiagram: layout.ChordDiagram,
  box: Box
) => {
  const numStrings = application.selection.part?.part?.instrument?.tuning?.length;
  if (!numStrings) {
    return null;
  }

  const diagram = chordDiagram.diagram.diagram;
  if (!diagram) {
    return null;
  }

  const numFrets = 5; // TODO make this configurable
  const fretY = box.y + 1.5 * STAFF_LINE_HEIGHT;
  const fretboardH = box.height - 1.5 * STAFF_LINE_HEIGHT;
  const fretW = box.width / (numStrings - 1);
  const fretH = fretboardH / numFrets;
  const textSize = chordDiagram.textSize;

  const openUnplayed = diagram.frets.slice(0, numStrings);
  diagram.barres.forEach((barre) => {
    openUnplayed.fill(1, barre.firstString, barre.lastString + 1);
  });

  // TODO enable this once chord diagrams can influence the width of chords. Not enough width at the moment.
  // renderText(context, {
  //   text: diagram.baseFret.toString(),
  //   box: new Box(box.x - STAFF_LINE_HEIGHT, fretY, textSize, textSize),
  //   size: textSize,
  //   halign: "center",
  //   valign: "center",
  // });

  context.strokeStyle = "#000000";
  context.fillStyle = "#000000";

  context.beginPath();

  context.lineWidth = LINE_STROKE_WIDTH * (diagram.baseFret == 1 ? 5 : 1);
  context.moveTo(box.x - 0.5 * LINE_STROKE_WIDTH, fretY);
  context.lineTo(box.right - 0.5 * LINE_STROKE_WIDTH, fretY);
  context.stroke();

  context.lineWidth = LINE_STROKE_WIDTH;
  range(1, numFrets + 1).forEach((fret) => {
    context.moveTo(box.x, fretY + fretH * fret);
    context.lineTo(box.right, fretY + fretH * fret);
  });

  range(numStrings).forEach((string) => {
    context.moveTo(box.x + fretW * string, fretY);
    context.lineTo(box.x + fretW * string, fretY + fretboardH);
  });

  context.stroke();

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

    Text(application, context, {
      box: new Box(box.x + (numStrings - index - 1.5) * fretW, box.y, fretW, height),
      halign: "center",
      valign: "end",
      size: textSize,
      text: text,
      style: { fontFamily: DEFAULT_SERIF_FONT_FAMILY },
    });
  });

  diagram.frets.forEach((fret, index) => {
    if (fret && fret > 0) {
      const cx = box.x + (numStrings - index - 1) * fretW;
      const cy = fretY + (fret - diagram.baseFret + 0.5) * fretH;
      context.moveTo(cx, cy);
      context.ellipse(cx, cy, 0.3 * fretW, 0.3 * fretW, 0, 0, 2 * Math.PI);
    }
  });

  diagram.barres.forEach((barre) => {
    const startX = (numStrings - barre.firstString - 1) * fretW;
    const endX = (numStrings - barre.lastString - 1) * fretW;
    const y = fretY + (barre.baseFret - diagram.baseFret + 0.5) * fretH;

    context.moveTo(box.x + startX, y);
    context.ellipse(box.x + startX, y, 0.3 * fretW, 0.3 * fretW, 0, 0, 2 * Math.PI);

    context.moveTo(box.x + endX, y);
    context.ellipse(box.x + endX, y, 0.3 * fretW, 0.3 * fretW, 0, 0, 2 * Math.PI);

    const rx = box.x + endX;
    const ry = y - 0.3 * fretW;
    context.moveTo(rx, ry);
    context.lineTo(rx + startX - endX, ry);
    context.lineTo(rx + startX - endX, ry + 0.6 * fretW);
    context.lineTo(rx, ry + 0.6 * fretW);
    context.lineTo(rx, ry);
  });

  context.fill();
  context.closePath();
};
