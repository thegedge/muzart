import { range } from "lodash";
import React from "react";
import layout, { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../../layout";
import { Box } from "../../../layout/utils/Box";
import { useCurrentPart } from "../../utils/CurrentPartContext";
import { BoxGroup } from "../layout/BoxGroup";
import { TextElement } from "./TextElement";

// TODO have ChordDiagram just be FretboardDiagram, and have layout use a group to show other text elements

export const ChordDiagram = (props: { element: layout.ChordDiagram }) => {
  const textBox = new Box(0, 0, props.element.box.width, STAFF_LINE_HEIGHT);

  let diagram;
  if (props.element.diagram.diagram) {
    const diagramBox = new Box(
      0,
      STAFF_LINE_HEIGHT,
      props.element.box.width,
      props.element.box.height - textBox.height
    );

    diagram = <FretboardDiagram diagram={props.element} box={diagramBox} />;
  } else {
    textBox.y = props.element.box.height - STAFF_LINE_HEIGHT;
  }

  return (
    <BoxGroup node={props.element}>
      <TextElement
        size={STAFF_LINE_HEIGHT}
        box={textBox}
        text={props.element.diagram.name}
        halign="center"
        style={{ fontFamily: "serif" }}
      />
      {diagram}
    </BoxGroup>
  );
};

const FretboardDiagram = (props: { diagram: layout.ChordDiagram; box: Box }) => {
  const part = useCurrentPart();
  const numStrings = part?.instrument?.tuning?.length;
  if (!numStrings) {
    return null;
  }

  const diagram = props.diagram.diagram.diagram;
  if (!diagram) {
    return null;
  }

  const numFrets = 5; // TODO make this configurable
  const fretY = props.box.y + 1.5 * STAFF_LINE_HEIGHT;
  const fretboardH = props.box.height - 1.5 * STAFF_LINE_HEIGHT;
  const fretW = props.box.width / (numStrings - 1);
  const fretH = fretboardH / numFrets;
  const textSize = props.diagram.textSize;

  const openUnplayed = diagram.frets.slice(0, numStrings);
  diagram.barres.forEach((barre) => {
    openUnplayed.fill(1, barre.firstString, barre.lastString + 1);
  });

  return (
    <>
      {/* TODO enable this once chord diagrams can influence the width of chords. Not enough width at the moment. */}
      {diagram.baseFret > 1000000 && (
        <TextElement
          text={diagram.baseFret.toString()}
          box={new Box(props.box.x - STAFF_LINE_HEIGHT, fretY, textSize, textSize)}
          size={textSize}
          halign="center"
          valign="center"
        />
      )}
      <line
        x1={props.box.x - 0.5 * LINE_STROKE_WIDTH}
        y1={fretY}
        x2={props.box.right + 0.5 * LINE_STROKE_WIDTH}
        y2={fretY}
        stroke="#000000"
        strokeWidth={LINE_STROKE_WIDTH * (diagram.baseFret == 1 ? 5 : 1)}
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

        return (
          <TextElement
            key={index}
            box={new Box(props.box.x + (numStrings - index - 1.5) * fretW, props.box.y, fretW, height)}
            halign="center"
            valign="end"
            size={textSize}
            text={text}
            style={{ fontFamily: "serif" }}
          />
        );
      })}
      {diagram.frets.map((fret, index) => {
        if (fret && fret > 0) {
          return (
            <circle
              key={index}
              cx={props.box.x + (numStrings - index - 1) * fretW}
              cy={fretY + (fret - diagram.baseFret + 0.5) * fretH}
              r={0.3 * fretW}
              fill="#000000"
            />
          );
        }
      })}
      {diagram.barres.map((barre, index) => {
        const startX = (numStrings - barre.firstString - 1) * fretW;
        const endX = (numStrings - barre.lastString - 1) * fretW;
        const y = fretY + (barre.baseFret - diagram.baseFret + 0.5) * fretH;
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
