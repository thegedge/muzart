import { observer } from "mobx-react-lite";
import { useApplicationState } from "../../../utils/ApplicationStateContext";
import { MeasureArea } from "./MeasureArea";
import { PartListingArea } from "./PartListingArea";

export const PartPanel = observer((_props: Record<string, never>) => {
  const { selection } = useApplicationState();
  const score = selection.score;
  if (!score) {
    return null;
  }

  return (
    <div className="part-panel flex h-full overflow-auto">
      <PartListingArea score={score.score} />
      <MeasureArea score={score.score} />
    </div>
  );
});
