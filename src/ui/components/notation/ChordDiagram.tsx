import { range } from "lodash";
import React from "react";
import layout, { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../../layout";
import { Box } from "../../../layout/utils/Box";
import * as notation from "../../../notation";
import { useCurrentPart } from "../../utils/CurrentPartContext";
import { BoxGroup } from "../layout/BoxGroup";
import { TextElement } from "./TextElement";

export const ChordDiagram = (props: { element: layout.ChordDiagram }) => {
  const middle = props.element.box.width * 0.5;
  const hw = STAFF_LINE_HEIGHT * 2;
  const dh = props.element.box.height - STAFF_LINE_HEIGHT;
  const textBox = new Box(0, 0, props.element.box.width, STAFF_LINE_HEIGHT);

  let diagram;
  if (props.element.diagram.diagram) {
    diagram = (
      <FretboardDiagram
        diagram={props.element.diagram.diagram}
        box={new Box(middle - hw, props.element.box.height - dh, 2 * hw, dh)}
      />
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
};

const FretboardDiagram = (props: { diagram: Required<notation.ChordDiagram>["diagram"]; box: Box }) => {
  const part = useCurrentPart();
  const numStrings = part?.instrument?.tuning?.length;
  if (!numStrings) {
    return null;
  }

  const numFrets = 5; // TODO make this configurable

  const fretY = props.box.y + 1.5 * STAFF_LINE_HEIGHT;
  const fretboardH = props.box.height - 1.5 * STAFF_LINE_HEIGHT;
  const fretW = props.box.width / (numStrings - 1);
  const fretH = fretboardH / numFrets;
  const textSize = 0.8 * STAFF_LINE_HEIGHT;

  const openUnplayed = props.diagram.frets.slice(0, numStrings);
  props.diagram.barres.forEach((barre) => {
    openUnplayed.fill(1, barre.firstString, barre.lastString + 1);
  });

  return (
    <>
      {/* TODO enable this once chord diagrams can influence the width of chords. Not enough width at the moment. */}
      {false && props.diagram.baseFret > 1 && (
        <TextElement
          text={props.diagram.baseFret.toString()}
          box={new Box(props.box.x - STAFF_LINE_HEIGHT, fretY, textSize, textSize)}
          size={textSize}
          halign="middle"
          valign="middle"
        />
      )}
      <line
        x1={props.box.x - 0.5 * LINE_STROKE_WIDTH}
        y1={fretY}
        x2={props.box.right + 0.5 * LINE_STROKE_WIDTH}
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
        />
      ))}
      {openUnplayed.map((v, index) => {
        let text;
        switch (v) {
          case undefined:
          case -1: {
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
            size={textSize}
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
};
