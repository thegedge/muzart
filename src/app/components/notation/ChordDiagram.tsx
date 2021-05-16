import { range } from "lodash";
import React from "react";
import * as notation from "../../../notation";
import { ChordDiagram, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../layout";
import Box from "../../layout/utils/Box";
import { BoxGroup } from "../layout/BoxGroup";
import { TextElement } from "./TextElement";

export function ChordDiagram(props: { element: ChordDiagram }) {
  const middle = props.element.box.width * 0.5;
  const hw = STAFF_LINE_HEIGHT * 2;
  const dh = props.element.box.height - STAFF_LINE_HEIGHT;
  const textBox = new Box(0, 0, props.element.box.width, STAFF_LINE_HEIGHT);

  let diagram;
  if (props.element.diagram.diagram) {
    diagram = (
      <>
        <FretboardDiagram
          diagram={props.element.diagram.diagram}
          box={new Box(middle - hw, props.element.box.height - dh, 2 * hw, dh)}
        />
      </>
    );
  } else {
    textBox.y = props.element.box.height - STAFF_LINE_HEIGHT;
  }

  return (
    <BoxGroup node={props.element}>
      <TextElement
        size={STAFF_LINE_HEIGHT}
        box={textBox}
        text={props.element.diagram.name}
        halign="middle"
        style={{ fontWeight: "bold" }}
      />
      {diagram}
    </BoxGroup>
  );
}

function FretboardDiagram(props: { diagram: Required<notation.ChordDiagram>["diagram"]; box: Box }) {
  // TODO maybe store in a react context?
  const numStrings = 6;
  const numFrets = 5;
  const fretY = props.box.y + 1.5 * STAFF_LINE_HEIGHT;
  const fretboardH = props.box.height - 1.5 * STAFF_LINE_HEIGHT;
  const fretW = props.box.width / (numStrings - 1);
  const fretH = fretboardH / numFrets;

  const openUnplayed = props.diagram.frets.slice(0, numStrings);
  props.diagram.barres.forEach((barre) => {
    openUnplayed.fill(1, barre.firstString, barre.lastString + 1);
  });

  return (
    <>
      <line
        x1={props.box.x}
        y1={fretY}
        x2={props.box.right}
        y2={fretY}
        stroke="#000000"
        strokeWidth={LINE_STROKE_WIDTH * (props.diagram.baseFret == 1 ? 5 : 1)}
      />
      {range(1, numFrets + 1).map((fret) => (
        <line
          key={fret}
          x1={props.box.x}
          y1={fretY + fretH * fret}
          x2={props.box.right}
          y2={fretY + fretH * fret}
          stroke="#000000"
          strokeWidth={LINE_STROKE_WIDTH}
        />
      ))}
      {range(numStrings).map((string) => (
        <line
          key={string}
          x1={props.box.x + fretW * string}
          y1={fretY}
          x2={props.box.x + fretW * string}
          y2={fretY + fretboardH}
          stroke="#000000"
          strokeWidth={LINE_STROKE_WIDTH}
        />
      ))}
      {openUnplayed.map((v, index) => {
        let text;
        switch (v) {
          case undefined: {
            text = "✗";
            break;
          }
          case 0: {
            text = "○";
            break;
          }
          default: {
            return;
          }
        }

        return (
          <TextElement
            key={index}
            box={new Box(props.box.x + (numStrings - index - 1.5) * fretW, props.box.y, fretW, STAFF_LINE_HEIGHT)}
            halign="middle"
            valign="end"
            size={0.8 * STAFF_LINE_HEIGHT}
            text={text}
          />
        );
      })}
      {props.diagram.frets.map((fret, index) => {
        if (fret && fret > 0) {
          return (
            <circle
              key={index}
              cx={props.box.x + (numStrings - index - 1) * fretW}
              cy={fretY + (fret - props.diagram.baseFret + 0.5) * fretH}
              r={0.3 * fretW}
              fill="#000000"
            />
          );
        }
      })}
      {props.diagram.barres.map((barre, index) => {
        // TODO make this a <path>
        const startX = (numStrings - barre.firstString - 1) * fretW;
        const endX = (numStrings - barre.lastString - 1) * fretW;
        const y = fretY + (barre.baseFret - props.diagram.baseFret + 0.5) * fretH;
        return (
          <React.Fragment key={index}>
            <circle cx={props.box.x + startX} cy={y} r={0.3 * fretW} fill="#000000" />
            <circle cx={props.box.x + endX} cy={y} r={0.3 * fretW} fill="#000000" />
            <rect
              x={props.box.x + endX}
              y={y - 0.3 * fretW}
              width={startX - endX}
              height={0.6 * fretW}
              fill="#000000"
            />
          </React.Fragment>
        );
      })}
    </>
  );
}
