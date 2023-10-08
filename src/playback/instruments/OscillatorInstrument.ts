import { compact } from "lodash";
import * as notation from "../../notation";
import { noteValueToSeconds } from "../util/durations";
import { Instrument, InstrumentOptions } from "./Instrument";

interface OscillatorOptions extends InstrumentOptions {
  type: OscillatorType;
}

/**
 * An instrument that uses an oscillator to generate notes.
 */
export class OscillatorInstrument extends Instrument {
  private type: OscillatorType;

  constructor(options: OscillatorOptions) {
    super(options);
    this.type = options.type;
  }

  playNote(note: notation.Note, tempo: number, startTimeFromNow?: number, ignoreTies = false): number | undefined {
    if (note.dead) {
      // TODO produce some percussive-y sound
      return;
    }

    const duration = noteValueToSeconds(note.value, tempo);
    const tieType = note.tie ? note.tie.type : "start";
    const when = this.currentTime + (startTimeFromNow ?? 0);

    try {
      if (tieType == "start") {
        const source = this.context.createOscillator();
        source.type = this.type;
        source.frequency.value = note.pitch.toFrequency();

        //---------------------------------------------------------------------------------------------
        // Connect all the things

        const volume = this.createGainNode(note);
        this.createEnvelope(
          volume.gain,
          {
            attack: 0.01,
            release: 10,
          },
          when,
        );

        source.connect(volume);
        volume.connect(this.context.destination);

        this.maybeBend(note, source.frequency, when);

        const vibrato = this.maybeVibrato(note, when);
        const effects: AudioNode[] = compact([vibrato]);
        if (effects.length > 0) {
          effects.reduce((node, previousNode) => {
            node.connect(previousNode);
            return node;
          });
          effects[0].connect(source.frequency);
        }

        //---------------------------------------------------------------------------------------------

        if (!ignoreTies && note.tie) {
          source.start(when);
        } else {
          volume.gain.setTargetAtTime(0, when + duration - 0.02, 0.025);
          source.start(when);
          source.stop(when + duration + 0.05);
        }
        this.addActiveSource(source, volume, note.pitch.toMidi());
      } else if (tieType == "stop") {
        const pitch = note.get("pitch", true);
        if (pitch) {
          const midi = pitch.toMidi();
          const sources = this.activeSources.get(midi);
          if (sources) {
            // TODO we may want to target one specific source, not all, so perhaps tie these things to notes
            for (const source of sources) {
              source.volume.gain.setTargetAtTime(0, when + duration - 0.02, 0.025);
              source.node.stop(when + duration + 0.05);
            }
          }
        }
      }
    } catch (e) {
      console.warn(e);
    }

    return duration;
  }
}
