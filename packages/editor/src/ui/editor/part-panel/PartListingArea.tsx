import type { Score } from "@muzart/notation";
import { observer } from "mobx-react-lite";
import { PartListingRow } from "./PartListingRow";

export const PartListingArea = observer((props: { score: Score }) => {
  return (
    <div
      className="sticky left-0 z-50 grid items-stretch gap-y-px bg-gray-950/75 pr-px"
      style={{
        gridTemplateColumns: `1.75rem max-content 1.75rem 1.75rem`,
        gridAutoRows: "1.75rem", // h-7
        gridTemplateRows: "2rem", // h-8
      }}
    >
      <div className="sticky top-0 flex w-8 items-center justify-center bg-inherit p-0.5 text-gray-500" />
      <div className="sticky top-0 col-start-2 flex items-center bg-inherit px-2">Track</div>
      <div className="sticky top-0 flex w-7 items-center justify-center bg-inherit p-0.5 text-gray-500" />
      <div className="sticky top-0 flex w-7 items-center justify-center rounded-r bg-inherit p-0.5 text-gray-500" />
      {props.score.parts.map((part, partIndex) => {
        return <PartListingRow key={partIndex} part={part} />;
      })}
    </div>
  );
});
