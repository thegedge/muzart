import { range } from "lodash";
import { JSX } from "preact";
import { NoteValue, NoteValueName } from "../../notation/NoteValue";

const STANDARD_HEAD_PATH = {
  path: "M 0.97586655,0.17386772 A 0.34705856,0.5205878 66.75189 0 1 0.63453699,0.69822967 0.34705856,0.5205878 66.75189 0 1 0.01923,0.58483386 0.34705856,0.5205878 66.75189 0 1 0.36055955,0.06047192 a 0.34705856,0.5205878 66.75189 0 1 0.615307,0.1133958 z",
  height: 0.85615134,
};

export const NoteValues = {
  [NoteValueName.Whole]: {
    stemmed: false,
    flags: 0,
    head: {
      path: "M 0.5,0 A 0.5,0.3 0 0 0 0,0.3 0.5,0.3 0 0 0 0.5,0.6 0.5,0.3 0 0 0 1,0.3 0.5,0.3 0 0 0 0.5,0 Z m -0.06902,0.028 A 0.3,0.225 50 0 1 0.672,0.1550.3,0.225 50 0 1 0.693,0.530 0.3,0.225 50 0 1 0.328,0.444 0.3,0.225 50 0 1 0.307,0.07 0.3,0.225 50 0 1 0.431,0.028 Z",
      height: 0.6,
    },
  },
  [NoteValueName.Half]: {
    stemmed: true,
    flags: 0,
    head: {
      path: "M 0.68802786,0 A 0.35642382,0.55320651 55.94147 0 0 0.38660643,0.08187174 0.35642382,0.55320651 55.94147 0 0 0.01289716,0.67926182 0.35642382,0.55320651 55.94147 0 0 0.61301363,0.77472532 0.35642382,0.55320651 55.94147 0 0 0.98672026,0.1759734 0.35642382,0.55320651 55.94147 0 0 0.68802786,0 Z M 0.79713659,0.0886811 A 0.19143527,0.50133235 52.79973 0 1 0.9021544,0.12959031 0.19143527,0.50133235 52.79973 0 1 0.60210012,0.59058656 0.19143527,0.50133235 52.79973 0 1 0.09609058,0.72561322 0.19143527,0.50133235 52.79973 0 1 0.39751202,0.26598414 0.19143527,0.50133235 52.79973 0 1 0.79713395,0.08867586 Z",
      height: 0.85615134,
    },
  },
  [NoteValueName.Quarter]: {
    stemmed: true,
    flags: 0,
    head: STANDARD_HEAD_PATH,
  },
  [NoteValueName.Eighth]: {
    stemmed: true,
    flags: 1,
    head: STANDARD_HEAD_PATH,
  },
  [NoteValueName.Sixteenth]: {
    stemmed: true,
    flags: 2,
    head: STANDARD_HEAD_PATH,
  },
  [NoteValueName.ThirtySecond]: {
    stemmed: true,
    flags: 3,
    head: STANDARD_HEAD_PATH,
  },
  [NoteValueName.SixtyFourth]: {
    stemmed: true,
    flags: 4,
    head: STANDARD_HEAD_PATH,
  },
  [NoteValueName.OneTwentyEighth]: {
    stemmed: true,
    flags: 5,
    head: STANDARD_HEAD_PATH,
  },
};

export const NoteValueIcon = (props: JSX.SVGAttributes<SVGSVGElement> & { noteValue: NoteValue | NoteValueName }) => {
  const { noteValue, ...svgProps } = props;
  const noteValueName = noteValue instanceof NoteValue ? noteValue.name : noteValue;
  const icon = NoteValues[noteValueName];
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
