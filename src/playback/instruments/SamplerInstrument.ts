import * as notation from "../../notation";
import { Note, NoteDynamic } from "../../notation";
import { SampleZone } from "../SoundFont";
import { Instrument } from "./Instrument";

export interface SamplerOptions {
  instrument: notation.Instrument;
  context: AudioContext;
  buffers: [number, SampleZone][];
}

export interface Envelope {
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
export abstract class SamplerInstrument implements Instrument {
  /** The instrument this sampler is derived from */
  protected instrument: notation.Instrument;

  /** The audio context in which this sampler instrument will be used */
  protected context: AudioContext;

  /** The stored and loaded buffers */
  protected buffers: Map<number, SampleZone>;

  /** The object of all currently playing BufferSources */
  protected activeSources: Map<number, ActiveSourceNodes[]> = new Map();

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

  abstract playNote(note: Note, tempo: number, startTimeFromNow?: number, ignoreTies?: boolean): void;

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

  protected createEnvelope(param: AudioParam, envelope: Partial<Envelope>, when: number) {
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

  protected createToneBufferSource(sample: SampleZone, offset: number) {
    const source = this.context.createBufferSource();
    source.buffer = sample.buffer;
    source.detune.value = -100 * offset;
    // source.playbackRate.value = Math.pow(2, -offset / 12);
    source.loop = true;
    source.loopStart = (sample.startLoop - sample.start) / sample.sampleRate;
    source.loopEnd = (sample.endLoop - sample.start) / sample.sampleRate;
    return source;
  }

  protected addActiveSource(audio: AudioBufferSourceNode, volume: GainNode, midiNote: number) {
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

  protected createGainNode(note: Note) {
    const volume = this.context.createGain();

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

    return volume;
  }
}
