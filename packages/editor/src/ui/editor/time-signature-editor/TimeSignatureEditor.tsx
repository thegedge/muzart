import * as notation from "@muzart/notation";
import { observer, useLocalObservable } from "mobx-react-lite";
import { useApplicationState } from "../../../utils/ApplicationStateContext";
import { narrowInstance } from "../../../utils/narrow";
import { Modal } from "../../misc/Modal";
import { TimeSignatureForm } from "./TimeSignatureForm";

export type ObservableTimeSignature = {
  count: number;
  value: notation.NoteValue;
  measure: notation.Measure;
  setCount(count: number): void;
  setValue(value: number): void;
};

export const TimeSignatureEditor = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  const measure = narrowInstance(application.state.modalSubject, notation.Measure);
  if (!measure || application.state.modalProperty != "staffDetails.time") {
    return null;
  }

  return <TimeSignatureEditorInner measure={measure} />;
});

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
          <TimeSignatureForm timeSignature={timeSignatureData} />
        </div>
      </div>
    </Modal>
  );
});
