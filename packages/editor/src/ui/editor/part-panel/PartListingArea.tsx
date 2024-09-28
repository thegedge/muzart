import type { Score } from "@muzart/notation";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { PartListingRow } from "./PartListingRow";

export const PartListingArea = observer((props: { score: Score }) => {
  const headerClasses = clsx("sticky top-0 backdrop-blur-2xs items-center flex bg-inherit");
  return (
    <div
      className="sticky left-0 z-50 grid items-stretch gap-y-px bg-gray-950/75 pr-px"
      style={{
        gridTemplateColumns: `1.75rem max-content 1.75rem 1.75rem`,
        gridAutoRows: "1.75rem", // h-7
        gridTemplateRows: "2rem", // h-8
      }}
    >
      <div className={headerClasses} />
      <div className={clsx(headerClasses, "px-2")}>Track</div>
      <div className={headerClasses} />
      <div className={headerClasses} />
      {props.score.parts.map((part, partIndex) => {
        return <PartListingRow key={partIndex} part={part} />;
      })}
    </div>
  );
});
