import { compact, memoize } from "lodash";
import * as notation from "../../notation";
import { NoteDynamic } from "../../notation";
import { SampleZone, SoundFontGeneratorType } from "../SoundFont";
import { noteValueToSeconds } from "../util/durations";
import { Instrument } from "./Instrument";

interface SamplerOptions {
  instrument: notation.Instrument;
  context: AudioContext;
  buffers: [number, SampleZone][];
}

interface Envelope {
  attack: number;
  hold: number;
  decay: number;
  release: number;
}

interface ActiveSourceNodes {
  audio: AudioBufferSourceNode;
  volume: GainNode;
}

/**
 * An instrument that takes a set of note buffers and can interpolate all other notes from those.
 */
export class SamplerInstrument implements Instrument {
  readonly name: string = "Sampler";

  /** The instrument this sampler is derived from */
  private instrument: notation.Instrument;

  /** The audio context in which this sampler instrument will be used */
  private context: AudioContext;

  /** The stored and loaded buffers */
  private buffers: Map<number, SampleZone>;

  /** The object of all currently playing BufferSources */
  private activeSources: Map<number, ActiveSourceNodes[]> = new Map();

  constructor(options: SamplerOptions) {
    if (!options.buffers) {
      throw new Error("no sample buffers provided to Sampler");
    }

    this.context = options.context;
    this.instrument = options.instrument;
    this.buffers = new Map(options.buffers);
  }

  get currentTime() {
    return this.context.currentTime;
  }

  dispose() {
    this.stop();
  }

  stop() {
    this.activeSources.forEach((sources) => {
      sources.forEach((source) => {
        source.audio.disconnect();
        source.volume.disconnect();
      });
    });
    this.activeSources.clear();
  }

  // TODO figure out if I could just use the regular ToneJS sampler hooked into some output nodes

  playNote(note: notation.Note, tempo: number, startTimeFromNow?: number): number | undefined {
    const duration = note.dead ? 0.05 : noteValueToSeconds(note.value, tempo);
    const tieType = note.tie ? note.tie.type : "start";
    const when = this.currentTime + (startTimeFromNow ?? 0);

    try {
      if (tieType == "start") {
        const midi = note.pitch.toMidi();
        const [sample, offset] = this.findClosest(midi);
        const source = this.createToneBufferSource(sample, offset);

        //---------------------------------------------------------------------------------------------

        const volume = this.context.createGain();

        const attack = sample.generators[SoundFontGeneratorType.EnvelopeVolumeAttack];
        const hold = sample.generators[SoundFontGeneratorType.EnvelopeVolumeHold];
        const decay = sample.generators[SoundFontGeneratorType.EnvelopeVolumeDecay];
        const release = sample.generators[SoundFontGeneratorType.EnvelopeVolumeRelease];
        // const sustain = sample.generators[SoundFontGeneratorType.EnvelopeVolumeSustain];

        let value = this.instrument.volume;
        switch (note.dynamic) {
          case NoteDynamic.Pianississimo:
            value *= 0.1;
            break;
          case NoteDynamic.Pianissimo:
            value *= 0.25;
            break;
          case NoteDynamic.Piano:
            value *= 0.5;
            break;
          case NoteDynamic.MezzoPiano:
            value *= 0.9;
            break;
          case NoteDynamic.MezzoForte:
            value *= 1.1;
            break;
          case NoteDynamic.Forte:
            value *= 1.5;
            break;
          case NoteDynamic.Fortissimo:
            value *= 1.75;
            break;
          case NoteDynamic.Fortississimo:
            value *= 2;
            break;
        }

        volume.gain.value = value;
        this.createEnvelope(volume.gain, { attack, hold, decay, release }, when);

        //---------------------------------------------------------------------------------------------
        // Connect all the things

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

        source.start(when, 0, note.tie ? undefined : duration);
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

  private createEnvelope(param: AudioParam, envelope: Partial<Envelope>, when: number) {
    const { attack, hold, decay, release } = envelope;
    const value = param.value;

    let currentEnvelopeTime = when;
    if (attack) {
      param.setValueAtTime(0, currentEnvelopeTime);
      param.linearRampToValueAtTime(value, currentEnvelopeTime + attack);
      currentEnvelopeTime += attack;
    } else {
      param.setValueAtTime(value, currentEnvelopeTime);
    }

    if (hold) {
      currentEnvelopeTime += hold;
    }

    if (decay) {
      // TODO use sustain value, if we can somehow set decibel output
      param.linearRampToValueAtTime(0.5 * value, currentEnvelopeTime + decay);
      currentEnvelopeTime += decay;
    }

    if (release) {
      param.linearRampToValueAtTime(0, currentEnvelopeTime + release);
      currentEnvelopeTime += release;
    }
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

  private createToneBufferSource(sample: SampleZone, offset: number) {
    const source = this.context.createBufferSource();
    source.buffer = sample.buffer;
    source.detune.value = -100 * offset;
    // source.playbackRate.value = Math.pow(2, -offset / 12);
    source.loop = true;
    source.loopStart = (sample.startLoop - sample.start) / sample.sampleRate;
    source.loopEnd = (sample.endLoop - sample.start) / sample.sampleRate;
    return source;
  }

  private addActiveSource(audio: AudioBufferSourceNode, volume: GainNode, midiNote: number) {
    let sources = this.activeSources.get(midiNote);
    if (!sources) {
      sources = [];
      this.activeSources.set(midiNote, sources);
    }
    sources.push({ audio, volume });

    const closureSources = sources;
    audio.addEventListener("ended", () => {
      const index = closureSources.findIndex((value) => value.audio == audio);
      if (index !== -1) {
        closureSources.splice(index, 1);
        audio.disconnect();
        volume.disconnect();
      }
    });

    return audio;
  }

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

    // source.connect(bend);
    source.start();

    return gain;
  }
}
