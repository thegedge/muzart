import { NoteValue, type NoteValueName } from "@muzart/notation";
import { resources } from "@muzart/render";
import { range } from "lodash-es";
import type { JSX } from "preact";

export const NoteValueIcon = (props: JSX.SVGAttributes<SVGSVGElement> & { noteValue: NoteValue | NoteValueName }) => {
  const { noteValue, ...svgProps } = props;
  const noteValueName = noteValue instanceof NoteValue ? noteValue.name : noteValue;
  const icon = resources.NoteValues[noteValueName];
  const dotted = noteValue instanceof NoteValue ? noteValue.dots : 0;

  const stemHeight = Math.max(3, icon.flags);
  const stemEnd = 0.3;
  const stemX = 0.96;

  const x = -1.5;
  const w = 4;
  const y = -stemHeight + stemEnd;
  const h = stemHeight + icon.head.height - stemEnd;

  return (
    <svg {...svgProps} viewBox={`${x} ${y} ${w} ${h}`} stroke-width="0.08" stroke-linecap="butt">
      <path d={icon.head.path} />
      {icon.stemmed && <line x1={stemX} y1={y} x2={stemX} y2={stemEnd} className="stroke-current" />}
      {icon.flags > 0 &&
        range(icon.flags).map((v) => {
          const flagW = 0.6; // half of the head width
          const flagH = 1;
          const offset = y + v * (stemHeight / (icon.flags * (flagH + 1)));
          return (
            <path
              key={v}
              d={`
                M ${stemX},${offset}
                c 0.1,${flagH} ${2.5 * flagW},${0.6 * flagH} ${flagW},${2 * flagH}
                c 0.1,${-0.5 * flagH} 0.5,${-flagH} ${-flagW},${-2 * flagH + 0.8}
                z
              `}
            />
          );
        })}
      {range(dotted).map((v) => (
        <circle key={v} cx={1.3 + v * 0.6} cy={0.7} r={0.2} />
      ))}
    </svg>
  );
};
