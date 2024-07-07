import type { Score } from "@muzart/notation";
import { observer } from "mobx-react-lite";
import { PartListingRow } from "./PartListingRow";

export const PartListingArea = observer((props: { score: Score }) => {
  return (
    <div
      className="grid-cols-part-list sticky left-0 z-50 grid flex-none items-stretch gap-y-px bg-gray-950/75 pr-px"
      style={{
        gridTemplateColumns: `repeat(4, auto)`,
        gridAutoRows: "1.5rem",
        gridTemplateRows: "1.75rem", // h-7
      }}
    >
      <div className="sticky top-0 col-start-2 flex-1 bg-inherit px-4">Track</div>
      <div className="sticky top-0 flex w-6 items-center justify-center bg-inherit p-0.5 text-gray-500" />
      <div className="sticky top-0 flex w-6 items-center justify-center rounded-r bg-inherit p-0.5 text-gray-500" />
      {props.score.parts.map((part, partIndex) => {
        return <PartListingRow key={partIndex} part={part} />;
      })}
    </div>
  );
});
