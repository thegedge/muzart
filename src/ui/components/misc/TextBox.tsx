import React, { useMemo } from "react";
import { Link } from "wouter";
import { Alignment, Box } from "../../../layout";

export interface TextBoxLine {
  text: string;
  fontSize?: number;
  fontWeight?: number | "normal" | "bold" | "lighter" | "bolder";
  lineHeight?: number;
  color?: string;
  alignment?: Alignment;
  href?: string;
}

export interface TextBoxProps {
  box: Box;
  fontSize: number;
  fontFamily?: string;
  lineHeight?: number;
  lines: TextBoxLine[];
}

export const TextBox = (props: TextBoxProps) => {
  const { lines, box } = props;
  const lineHeight = props.lineHeight ?? 1.1 * props.fontSize;

  const y = useMemo(() => {
    const linesHeight = lines.reduce((h, line) => h + (line.lineHeight ?? line.fontSize ?? lineHeight), 0);
    return box.y + (box.height - linesHeight) * 0.5;
  }, [lines]);

  return (
    <text
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="rgb(156, 163, 175)"
      fontSize={props.fontSize}
      fontFamily={props.fontFamily}
      fontWeight="normal"
    >
      {lines.map((line, index) => {
        let x: number;
        switch (line.alignment) {
          case "start":
            x = box.x;
            break;
          case undefined:
          case "center":
            x = box.centerX;
            break;
          case "end":
            x = box.right;
            break;
        }

        return (
          <tspan
            key={index}
            x={x}
            textAnchor={line.alignment}
            fontSize={line.fontSize}
            fontWeight={line.fontWeight}
            fill={line.color}
            dy={line.lineHeight ?? line.fontSize ?? lineHeight}
          >
            {line.href ? <Link href={line.href}>{line.text}</Link> : line.text}
          </tspan>
        );
      })}
    </text>
  );
};
