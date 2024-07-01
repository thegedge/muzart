import * as notation from "@muzart/notation";
import { Bend, BendPoint, BendType, defaultBendPointsForType } from "@muzart/notation";
import { observable } from "mobx";
import { observer } from "mobx-react-lite";
import { useLayoutEffect, useMemo, useRef } from "preact/hooks";
import { changeNoteAction } from "../../../actions/editing/note/ChangeNote";
import { useApplicationState } from "../../../utils/ApplicationStateContext";
import { narrowInstance } from "../../../utils/narrow";
import { Modal } from "../../misc/Modal";
import { BendPointGrid } from "./BendPointGrid";

export type ObservableBend = Bend & {
  note: notation.Note;

  setType(type: BendType): void;
  setAmplitude(value: number): void;
  addBendPoint(time: number, amplitude: number): BendPoint | undefined;
  removeBendPoint(point: BendPoint): void;
};

export const BendEditor = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  const note = narrowInstance(application.state.modalSubject, notation.Note);

  const popoverRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!popoverRef.current) {
      return;
    }

    note ? popoverRef.current.showPopover() : popoverRef.current.hidePopover();
  }, [note]);

  return (
    <Modal ref={popoverRef} title="Bend">
      {note && application.state.modalProperty == "bend" && <BendEditorInner note={note} />}
    </Modal>
  );
});

const BendEditorInner = observer((props: { note: notation.Note }) => {
  const bend = useMemo((): ObservableBend => {
    const maybeBend = props.note.bend;
    const copyBend = maybeBend
      ? {
          type: maybeBend.type,
          amplitude: maybeBend.amplitude,
          points: observable(maybeBend.points.map((v) => v)),
        }
      : {
          type: BendType.Bend,
          amplitude: 1,
          points: defaultBendPointsForType(BendType.Bend),
        };

    return observable({
      ...copyBend,
      note: props.note,

      addBendPoint(time: number, amplitude: number) {
        const index = this.points.findIndex((point) => time < point.time);
        if (index == -1) {
          // TODO should never happen, but perhaps some weird event outside the 0-1 range so we could create something just inside
        } else {
          const point = observable({ time, amplitude });
          this.points.splice(index, 0, point);
          return point;
        }
      },

      removeBendPoint(point: BendPoint) {
        this.points.splice(this.points.indexOf(point), 1);
      },

      setType(type: BendType) {
        this.type = type;
        this.points = defaultBendPointsForType(type);
      },

      setAmplitude(value: number) {
        this.amplitude = value;
      },
    });
  }, [props.note]);

  return (
    <div className="flex flex-row items-center justify-between gap-4">
      <BendPointGrid bend={bend} className="min-w-[50vw] flex-1" />
      <BendFormControls bend={bend} />
    </div>
  );
});

const BendFormControls = observer((props: { bend: ObservableBend }) => {
  const application = useApplicationState();
  const bend = props.bend;

  const clearBend = () => {
    application.dispatch(changeNoteAction({ bend: undefined }));
    application.state.hideModal();
  };

  const setBend = () => {
    application.dispatch(
      changeNoteAction({
        bend: {
          type: bend.type,
          amplitude: bend.amplitude,
          points: bend.points,
        },
      }),
    );
    application.state.hideModal();
  };

  return (
    <div className="flex flex-col items-stretch justify-between gap-y-4 self-stretch">
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-2">
          <label for="name" className="font-bold">
            Type:
          </label>
          <select
            name="type"
            size={Object.values(BendType).length}
            className="overflow-clip rounded p-2"
            onChange={(event) => bend.setType(event.currentTarget.value as BendType)}
          >
            {Object.values(BendType).map((bendType) => (
              <option key={bendType} selected={bendType == bend.type}>
                {bendType}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-x-2">
            <label for="amplitude" className="font-bold">
              Amplitude:
            </label>
            <div className="flex-1">{bend.amplitude}</div>
          </div>
          <input
            type="range"
            name="amplitude"
            step="0.1"
            min="0.1"
            max="5"
            value={bend.amplitude}
            className="col-span-2 flex"
            onChange={(event) => bend.setAmplitude(Number(event.currentTarget.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2">
        <button
          className="rounded border border-red-300/50 bg-red-200 px-4 py-1 text-red-900"
          onClick={() => clearBend()}
        >
          Clear
        </button>
        <button
          className="rounded border border-gray-400/50 bg-gray-300 px-4 py-1 text-gray-900"
          onClick={() => setBend()}
        >
          Set
        </button>
      </div>
    </div>
  );
});
