import { compact } from "lodash";
import * as notation from "../../notation";
import { SoundFontGeneratorType } from "../SoundFont";
import { noteValueToSeconds } from "../util/durations";
import { SamplerInstrument, SamplerOptions } from "./SamplerInstrument";

/**
 * An instrument that takes a set of note buffers and can interpolate all other notes from those.
 */
export class PitchAdjustableInstrument extends SamplerInstrument {
  constructor(options: SamplerOptions) {
    super(options);
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
        const midi = note.pitch.toMidi();
        const [sample, offset] = this.findClosest(midi);
        const source = this.createToneBufferSource(sample, offset);

        //---------------------------------------------------------------------------------------------
        // Connect all the things

        const volume = this.createGainNode(note);
        const attack = sample.generators[SoundFontGeneratorType.EnvelopeVolumeAttack];
        const decay = sample.generators[SoundFontGeneratorType.EnvelopeVolumeDecay];
        const release = sample.generators[SoundFontGeneratorType.EnvelopeVolumeRelease];
        const sustain = sample.generators[SoundFontGeneratorType.EnvelopeVolumeSustain];
        this.createEnvelope(volume.gain, { attack, sustain, decay, release }, when);

        source.connect(volume);
        volume.connect(this.context.destination);

        this.maybeBend(note, source.playbackRate, when);

        const vibrato = this.maybeVibrato(note, when);
        const effects: AudioNode[] = compact([vibrato]);
        if (effects.length > 0) {
          effects.reduce((node, previousNode) => {
            node.connect(previousNode);
            return node;
          });
          effects[0].connect(source.playbackRate);
        }

        //---------------------------------------------------------------------------------------------

        if (!ignoreTies && note.tie) {
          source.start(when, 0);
        } else {
          volume.gain.setTargetAtTime(0, when + duration - 0.02, 0.025);
          source.start(when, 0, duration + 0.05);
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
