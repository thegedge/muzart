import { FunctionalComponent } from "preact";
import React, { JSX } from "react";
import layout, { LineElement, PageElement } from "../../../layout";
import { BoxGroup } from "../layout/BoxGroup";
import { Arc } from "./Arc";
import { BarLine } from "./BarLine";
import { Beam } from "./Beam";
import { Bend } from "./Bend";
import { ChordDiagram } from "./ChordDiagram";
import { DashedLineText } from "./DashedLineText";
import { Dot } from "./Dot";
import { Note } from "./Note";
import { Rest } from "./Rest";
import { Slide } from "./Slide";
import { Stroke } from "./Stroke";
import { TextElement } from "./TextElement";
import { TimeSignature } from "./TimeSignature";
import { Vibrato } from "./Vibrato";

type ElementType = PageElement | LineElement;
type GroupElements = layout.Chord | layout.Group<ElementType> | layout.Measure | layout.PageLine;

export const ScoreElement = <T extends ElementType>(props: { element: T }): JSX.Element => {
  const Element = Elements[props.element.type] as FunctionalComponent<{ element: T }>;
  return <Element element={props.element} />;
};

const Group = (props: { element: GroupElements }) => {
  // Index keys probably aren't going to be the best here, especially once we support editing
  return (
    <BoxGroup element={props.element}>
      {props.element.children.map((e, index) => (
        <ScoreElement key={index} element={e} />
      ))}
    </BoxGroup>
  );
};

const Elements = {
  Arc,
  BarLine,
  Bend,
  Beam,
  ChordDiagram,
  DashedLineText,
  Dot,
  Chord: Group,
  Group,
  Measure: Group,
  PageLine: Group,
  Line: (props: { element: layout.Line }) => {
    return (
      <line
        x1={props.element.box.x}
        y1={props.element.box.y}
        x2={props.element.box.right}
        y2={props.element.box.bottom}
        stroke={props.element.color}
      />
    );
  },
  Note,
  Stroke,
  Rest,
  Slide,
  Space: BoxGroup,
  Text: (props: { element: layout.Text }) => {
    return <TextElement {...props.element} text={props.element.value} />;
  },
  TimeSignature,
  Vibrato,
} as const;
