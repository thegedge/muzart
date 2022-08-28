import React, { useMemo } from "react";
import { Alignment, Box } from "../../../layout";

export interface TextBoxLine {
  text: string;
  fontSize?: number;
  fontWeight?: string;
  lineHeight?: number;
  color?: string;
  alignment?: Alignment;
  onClick?: (event: MouseEvent) => void;
}

export function TextBox(props: { fontSize: number; lineHeight?: number; box: Box; lines: TextBoxLine[] }) {
  const { lines, box } = props;
  const lineHeight = props.lineHeight ?? 1.1 * props.fontSize;

  const y = useMemo(() => {
    const linesHeight = lines.reduce((h, line) => h + (line.lineHeight ?? line.fontSize ?? lineHeight), 0);
    return box.y + (box.height - linesHeight) * 0.5;
  }, [lines]);

  return (
    <text y={y} textAnchor="middle" dominantBaseline="middle" fill="rgb(156, 163, 175)" fontSize={props.fontSize}>
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
            onClick={line.onClick}
            dy={line.lineHeight ?? line.fontSize ?? lineHeight}
          >
            {line.onClick ? (
              <a href="#" onClick={line.onClick}>
                {line.text}
              </a>
            ) : (
              line.text
            )}
          </tspan>
        );
      })}
    </text>
  );
}
