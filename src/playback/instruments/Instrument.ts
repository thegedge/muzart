import { Note } from "../../notation";
import * as notation from "../../notation";
import { noteDurationInSeconds } from "../util/durations";

/** @see https://en.wikipedia.org/wiki/Envelope_(music)#ADSR */
export interface Envelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface InstrumentOptions {
  context: AudioContext;
  instrument: notation.Instrument;
}

interface ActiveSourceNodes {
  volume: GainNode;
  node: AudioScheduledSourceNode;
}

/**
 * Base class for any playback instrument.
 */
export abstract class Instrument {
  /** The audio context in which this sampler instrument will be used */
  protected context: AudioContext;

  /** The instrument this sampler is derived from */
  protected instrument: notation.Instrument;

  /** The object of all currently playing BufferSources */
  protected activeSources: Map<number, ActiveSourceNodes[]> = new Map();

  constructor(options: InstrumentOptions) {
    this.context = options.context;
    this.instrument = options.instrument;
  }

  /**
   * Stop all actively playing notes
   */
  stop() {
    this.activeSources.forEach((sources) => {
      sources.forEach((source) => {
        source.node.disconnect();
        source.volume.disconnect();
      });
    });
    this.activeSources.clear();
  }

  /**
   * Play a given note on this instrument.
   *
   * @param [note] the note to play
   * @param [tempo] the tempo to play the note at
   * @param [startTimeFromNow] optional starting time, seconds from the current time
   * @param [ignoreTies] if true, only play the note for its own duration
   */
  abstract playNote(note: Note, tempo: number, startTimeFromNow?: number, ignoreTies?: boolean): void;

  /**
   * Get the current time of the audio context.
   *
   * Note, this is different from `performance.now()`, which is the time since the page loaded. Similarly,
   * `Date.now()` is the time since the epoch.
   */
  get currentTime() {
    return this.context.currentTime;
  }

  /**
   * Create an "attack, decay, sustain, release" envelope for a given parameter.
   */
  protected createEnvelope(param: AudioParam, envelope: Partial<Envelope>, when: number) {
    const { attack, sustain: hold, decay, release } = envelope;
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

  /**
   * Track an actively playing source.
   */
  protected addActiveSource(audio: AudioScheduledSourceNode, volume: GainNode, midiNote: number) {
    let sources = this.activeSources.get(midiNote);
    if (!sources) {
      sources = [];
      this.activeSources.set(midiNote, sources);
    }
    sources.push({ node: audio, volume });

    const closureSources = sources;
    audio.addEventListener("ended", () => {
      const index = closureSources.findIndex((value) => value.node == audio);
      if (index !== -1) {
        closureSources.splice(index, 1);
        audio.disconnect();
        volume.disconnect();
      }
    });

    return audio;
  }

  /**
   * Create a gain for a given note.
   */
  protected createGainNode(note: Note) {
    const volume = this.context.createGain();

    let value = this.instrument.volume * 0.2;
    switch (note.dynamic) {
      case notation.NoteDynamic.Pianississimo:
        value *= 0.1;
        break;
      case notation.NoteDynamic.Pianissimo:
        value *= 0.25;
        break;
      case notation.NoteDynamic.Piano:
        value *= 0.5;
        break;
      case notation.NoteDynamic.MezzoPiano:
        value *= 0.9;
        break;
      case notation.NoteDynamic.MezzoForte:
        value *= 1.1;
        break;
      case notation.NoteDynamic.Forte:
        value *= 1.5;
        break;
      case notation.NoteDynamic.Fortissimo:
        value *= 1.75;
        break;
      case notation.NoteDynamic.Fortississimo:
        value *= 2;
        break;
    }

    volume.gain.value = value;

    return volume;
  }

  /**
   * Return an audio node that can adjust `playbackRate` of the source node for vibrato, if the note has it.
   */
  protected maybeVibrato(note: notation.Note, when: number) {
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

  /**
   * Return an audio node that can adjust `playbackRate` of the source node for a bend, if the note has one.
   */
  protected maybeBend(note: notation.Note, playbackRate: AudioParam, when: number) {
    if (!note.bend) {
      return null;
    }

    // TODO why doesn't a constant source node with offset events feeding into the playbackRate param work?

    const duration = noteDurationInSeconds(note);
    const gain = this.context.createGain();
    const initialRate = playbackRate.value;

    playbackRate.setValueAtTime(initialRate, when);

    let previousEventEnd = when;
    let previousPoint = 0;
    for (const { time, amplitude } of note.bend.points) {
      const value = initialRate * Math.pow(2, (amplitude * 2) / 12);
      const bendPointDuration = duration * (time - previousPoint);
      playbackRate.linearRampToValueAtTime(value, previousEventEnd + bendPointDuration);
      previousPoint = time;
      previousEventEnd += bendPointDuration;
    }

    playbackRate.setValueAtTime(initialRate, previousEventEnd);

    return gain;
  }
}
