import { compact, memoize } from "lodash";
import * as notation from "../../notation";
import { SampleZone, SoundFontGeneratorType } from "../SoundFont";
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
        const hold = sample.generators[SoundFontGeneratorType.EnvelopeVolumeHold];
        const decay = sample.generators[SoundFontGeneratorType.EnvelopeVolumeDecay];
        const release = sample.generators[SoundFontGeneratorType.EnvelopeVolumeRelease];
        // const sustain = sample.generators[SoundFontGeneratorType.EnvelopeVolumeSustain];
        this.createEnvelope(volume.gain, { attack, hold, decay, release }, when);

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

        source.start(when, 0, !ignoreTies && note.tie ? undefined : duration);
        this.addActiveSource(source, volume, note.pitch.toMidi());
      } else if (tieType == "stop") {
        const pitch = note.get("pitch", true);
        if (pitch) {
          const midi = pitch.toMidi();
          const sources = this.activeSources.get(midi);
          if (sources) {
            // TODO we may want to target one specific source, not all, so perhaps tie these things to notes
            for (const source of sources) {
              source.audio.stop(when + duration);
            }
          }
        }
      }
    } catch (e) {
      console.warn(e);
    }

    return duration;
  }

  /** Returns the difference in steps between the given midi note at the closets sample.  */
  private findClosest = memoize((midi: number): [SampleZone, number] => {
    for (let offset = 0; offset < 96; ++offset) {
      const hiBuffer = this.buffers.get(midi + offset);
      if (hiBuffer) {
        return [hiBuffer, offset];
      }

      const loBuffer = this.buffers.get(midi - offset);
      if (loBuffer) {
        return [loBuffer, -offset];
      }
    }

    throw new Error(`No available buffers for note: ${midi}`);
  });

  private maybeVibrato(note: notation.Note, when: number) {
    if (!note.vibrato) {
      return null;
    }

    const oscillator = this.context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = 4; // TODO make customizable

    const amplitude = this.context.createGain();
    amplitude.gain.value = Math.pow(2, -6); // TODO understand this value better

    oscillator.connect(amplitude);
    oscillator.start(when);

    return amplitude;
  }

  private maybeBend(note: notation.Note, bend: AudioParam, when: number) {
    if (!note.bend) {
      return null;
    }

    const source = this.context.createConstantSource();
    source.offset.value = 0.1;

    // TODO why doesn't a constant source node with offset events feeding into the playbackRate param work?

    // TODO incoroprate tempo + tied notes into duration
    const duration = noteValueToSeconds(note.value);
    const gain = this.context.createGain();

    bend.setValueAtTime(1, when);

    let previousEventEnd = when;
    let previousPoint = 0;
    for (const { time, amplitude } of note.bend.points) {
      const value = Math.pow(2, (amplitude * 2) / 12);
      const bendPointDuration = duration * (time - previousPoint);
      bend.linearRampToValueAtTime(value, previousEventEnd + bendPointDuration);
      previousPoint = time;
      previousEventEnd += bendPointDuration;
    }

    source.start();

    return gain;
  }
}
