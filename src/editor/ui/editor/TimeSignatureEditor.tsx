import { observer, useLocalObservable } from "mobx-react-lite";
import * as notation from "../../../notation";
import { ChangeTimeSignature } from "../../actions/editing/ChangeTimeSignature";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Modal } from "../misc/Modal";

export const TimeSignatureEditor = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  if (!application.state.editingTimeSignature) {
    return null;
  }

  return <TimeSignatureEditorInner />;
});

type ObservableTimeSignature = {
  count: number;
  value: notation.NoteValue;
  setCount(count: number): void;
  setValue(value: number): void;
};

const TimeSignatureEditorInner = observer((_props: Record<string, never>) => {
  const application = useApplicationState();

  const timeSignature = application.selection?.measure?.measure.staffDetails.time;
  if (!timeSignature) {
    return null;
  }

  const timeSignatureData = useLocalObservable<ObservableTimeSignature>(() => ({
    count: timeSignature.value.count,
    value: timeSignature.value.value,

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

  const part = application.selection?.part?.part;
  const measure = application.selection?.measure?.measure;
  if (!part || !measure) {
    return null;
  }

  const clear = () => {
    application.dispatch(new ChangeTimeSignature(part, measure, null));
    application.state.toggleEditingTimeSignature();
  };

  const set = () => {
    const timeSignature = new notation.TimeSignature(props.timeSignature.value, props.timeSignature.count);
    application.dispatch(new ChangeTimeSignature(part, measure, timeSignature));
    application.state.toggleEditingTimeSignature();
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
