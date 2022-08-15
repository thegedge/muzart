import * as notation from "../../notation";
import { SoundFontGeneratorType } from "../SoundFont";
import { noteValueToSeconds } from "../util/durations";
import { SamplerInstrument, SamplerOptions } from "./SamplerInstrument";

/**
 * An instrument that takes a set of note buffers and can interpolate all other notes from those.
 */
export class Percussion extends SamplerInstrument {
  constructor(options: SamplerOptions) {
    super(options);
  }

  playNote(note: notation.Note, tempo: number, startTimeFromNow?: number): number | undefined {
    if (note.dead) {
      return;
    }

    const duration = noteValueToSeconds(note.value, tempo);
    const when = this.currentTime + (startTimeFromNow ?? 0);

    try {
      const midi = note.pitch.toMidi();
      const sample = this.buffers.get(midi);
      if (!sample) {
        return;
      }

      const source = this.createToneBufferSource(sample, 0, false);

      //---------------------------------------------------------------------------------------------
      // Connect all the things

      const volume = this.createGainNode(note);
      const attack = sample.generators[SoundFontGeneratorType.EnvelopeVolumeAttack];
      const hold = sample.generators[SoundFontGeneratorType.EnvelopeVolumeHold];
      const decay = sample.generators[SoundFontGeneratorType.EnvelopeVolumeDecay];
      const release = sample.generators[SoundFontGeneratorType.EnvelopeVolumeRelease];
      // const sustain = sample.generators[SoundFontGeneratorType.EnvelopeVolumeSustain];
      this.createEnvelope(volume.gain, { attack, hold, decay, release }, when);

      source.connect(volume);
      volume.connect(this.context.destination);

      //---------------------------------------------------------------------------------------------

      source.start(when, 0, duration);
      this.addActiveSource(source, volume, note.pitch.toMidi());
    } catch (e) {
      console.warn(e);
    }

    return duration;
  }
}
