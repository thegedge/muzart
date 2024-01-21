import { observer, useLocalObservable } from "mobx-react-lite";
import * as notation from "../../../notation";
import { narrowInstance } from "../../../utils/narrow";
import { ChangeTimeSignature } from "../../actions/editing/ChangeTimeSignature";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Modal } from "../misc/Modal";

export const TimeSignatureEditor = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  const measure = narrowInstance(application.state.modalSubject, notation.Measure);
  if (!measure || application.state.modalProperty != "staffDetails.time") {
    return null;
  }

  return <TimeSignatureEditorInner measure={measure} />;
});

type ObservableTimeSignature = {
  count: number;
  value: notation.NoteValue;
  measure: notation.Measure;
  setCount(count: number): void;
  setValue(value: number): void;
};

const TimeSignatureEditorInner = observer((props: { measure: notation.Measure }) => {
  const timeSignature = props.measure.staffDetails.time;
  if (!timeSignature) {
    return null;
  }

  const timeSignatureData = useLocalObservable<ObservableTimeSignature>(() => ({
    count: timeSignature.value.count,
    value: timeSignature.value.value,
    measure: props.measure,

    setValue(value: number) {
      this.value = notation.NoteValue.fromNumber(value);
    },

    setCount(count: number) {
      this.count = count;
    },
  }));

  return (
    <Modal title="Time signature">
      <div
        className="grid gap-x-4 gap-y-2"
        style={{
          gridTemplateColumns: "auto 1fr",
        }}
      >
        <label for="count">Count:</label>
        <input
          type="number"
          name="count"
          value={timeSignatureData.count}
          onChange={(event) => timeSignatureData.setCount(parseInt(event.currentTarget.value))}
        />
        <label for="value">Value:</label>
        <select
          name="value"
          value={timeSignatureData.value.toNumber()}
          onChange={(event) => timeSignatureData.setValue(parseInt(event.currentTarget.value))}
        >
          <option value="2">2</option>
          <option value="4">4</option>
          <option value="8">8</option>
          <option value="16">16</option>
        </select>
        <div className="col-span-2">
          <FormControls timeSignature={timeSignatureData} />
        </div>
      </div>
    </Modal>
  );
});

const FormControls = observer((props: { timeSignature: ObservableTimeSignature }) => {
  const application = useApplicationState();

  // TODO we're assuming this part is the part that contains the measure below
  const part = application.selection?.part?.part;
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
