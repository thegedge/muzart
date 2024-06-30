import { observer } from "mobx-react-lite";
import * as notation from "../../../../notation";
import { useApplicationState } from "../../../utils/ApplicationStateContext";
import type { ObservableTimeSignature } from "./TimeSignatureEditor";
import { ChangeTimeSignature } from "../../../actions/editing/measure/ChangeTimeSignature";

export const TimeSignatureForm = observer((props: { timeSignature: ObservableTimeSignature }) => {
  const application = useApplicationState();

  // TODO we're assuming this part is the part that contains the measure below
  const part = application.selection.part?.part;
  if (!part) {
    return null;
  }

  const measure = props.timeSignature.measure;

  const clear = () => {
    application.dispatch(new ChangeTimeSignature(part, measure, null));
    application.state.hideModal();
  };

  const set = () => {
    const timeSignature = new notation.TimeSignature(props.timeSignature.value, props.timeSignature.count);
    application.dispatch(new ChangeTimeSignature(part, measure, timeSignature));
    application.state.hideModal();
  };

  return (
    <div className="flex flex-col items-stretch justify-between gap-y-4 self-stretch">
      <div className="grid grid-cols-2 gap-x-2">
        <button className="rounded border border-red-300/50 bg-red-200 px-4 py-1 text-red-900" onClick={() => clear()}>
          Clear
        </button>
        <button className="rounded border border-gray-400/50 bg-gray-300 px-4 py-1 text-gray-900" onClick={() => set()}>
          Set
        </button>
      </div>
    </div>
  );
});
