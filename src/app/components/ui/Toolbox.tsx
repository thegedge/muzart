import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useApplicationState } from "../utils/ApplicationStateContext";

export const Toolbox = observer(function Toolbox(_props: Record<string, never>) {
  const { selection, playback, debug, score } = useApplicationState();
  const instrument = selection.part?.part.instrument;
  const [midiInstrument, setMidiInstrument] = useState(instrument?.midiPreset ?? 24);

  useEffect(() => {
    if (instrument) {
      instrument.midiPreset = midiInstrument;
    }
  }, [instrument, midiInstrument]);

  if (!score) {
    return null;
  }

  const onPartChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    selection.update({ partIndex: event.target.selectedIndex });
  };

  const onInstrumentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMidiInstrument(parseInt(event.target.value));
  };

  const onDebugToggled = (event: React.ChangeEvent<HTMLInputElement>) => {
    debug.setEnabled(event.currentTarget.checked);
  };

  return (
    <div className="sticky top-4 h-0">
      <div className="max-w-max flex flex-row items-center bg-black bg-opacity-80 rounded-xl px-2 py-4 absolute right-4 text-gray-400 divide-x space-x-2">
        <div className="px-2">
          <input type="checkbox" name="debug" onChange={onDebugToggled} /> <label htmlFor="debug">Debug</label>
        </div>
        <select
          className="bg-transparent px-2 focus:outline-none"
          onChange={onPartChange}
          value={selection.partIndex}
          defaultValue={0}
        >
          {score.score.parts.map((part, index) => (
            <option key={index} value={index} style={{ color: "initial" }}>
              {part.name}
            </option>
          ))}
        </select>
        {playback.instruments.length > 0 && (
          <select
            className="bg-transparent px-2 focus:outline-none"
            onChange={onInstrumentChange}
            value={midiInstrument}
          >
            {playback.instruments.map((instrument) => (
              <option key={instrument.midiPreset} value={instrument.midiPreset} style={{ color: "initial" }}>
                {instrument.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
});
