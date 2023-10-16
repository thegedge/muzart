import { compact } from "lodash";
import * as notation from "../notation";
import { AudioNode } from "./nodes/AudioNode";
import { WrappedNode } from "./nodes/WrappedNode";
import { InstrumentOptions, SourceGenerator } from "./types";
import { noteDurationInSeconds, noteValueToSeconds } from "./util/durations";

/**
 * Base class for any playback instrument.
 */
export class Instrument {
  /** The audio context in which this sampler instrument will be used */
  protected context: AudioContext;

  /** The instrument this sampler is derived from */
  protected instrument: notation.Instrument;

  /** The object of all currently playing BufferSources */
  protected activeSources: Map<notation.Note, AudioNode> = new Map();

  /** The sink for all audio output */
  protected destination: AudioNode;

  /** A generator that can produce a source node for a given note */
  protected sourceGenerator: SourceGenerator;

  constructor(options: InstrumentOptions) {
    this.context = options.context;
    this.instrument = options.instrument;
    this.sourceGenerator = options.sourceGenerator;

    // Use a compressor node connected the context destination to avoid things being too loud
    this.destination = new WrappedNode(
      new DynamicsCompressorNode(this.context, {
        attack: 0.005,
        release: 1,
        knee: 10,
        ratio: 12,
        threshold: -20,
      }),
    );

    this.destination.raw.connect(this.context.destination);
  }

  /**
   * Stop all actively playing notes
   */
  stop() {
    this.activeSources.forEach((source) => source.dispose());
    this.activeSources.clear();
  }

  /**
   * Play a given note on this instrument.
   *
   * @param note the note to play
   * @param tempo the tempo to play the note at
   * @param when optional starting time, in seconds, from the current time
   * @param durationSecs optional duration to play the note for, override the node's value
   */
  playNote(note: notation.Note, tempo: number, when?: number, durationSecs?: number): void {
    if (note.dead) {
      // TODO produce some percussive-y sound
      return;
    }

    const tieType = note.tie ? note.tie.type : "start";
    if (tieType != "start") {
      return;
    }

    // TODO need to compute the sum of all the durations of the notes that are tied together,
    //  plus all the durations of the notes that are between the ties. Perhaps the easiest way to
    // do this is to actually just queue up a stop, and have the caller figure out the timings.

    const duration = durationSecs ?? noteValueToSeconds(note.value, tempo);
    try {
      const startTime = this.currentTime + (when ?? 0);
      const source = this.sourceGenerator.generate(note);

      const pitchParam = source.pitch;
      if (pitchParam) {
        this.maybeBend(note, pitchParam, tempo, startTime);

        const vibrato = this.maybeVibrato(note, startTime);
        const effects: globalThis.AudioNode[] = compact([vibrato]);
        if (effects.length > 0) {
          effects.reduce((previousNode, node) => {
            previousNode.connect(node);
            return node;
          });
          effects[effects.length - 1].connect(pitchParam);
        }
      }

      source.connect(this.destination);
      source.start(startTime, duration);

      this.activeSources.set(note, source);
      source.on("ended", () => {
        source.dispose();
        this.activeSources.delete(note);
      });
    } catch (e) {
      console.warn(e);
    }
  }

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
   * Return an audio node that can adjust `playbackRate` of the source node for vibrato, if the note has it.
   */
  protected maybeVibrato(note: notation.Note, when: number) {
    if (!note.vibrato) {
      return null;
    }

    const oscillator = new OscillatorNode(this.context, {
      type: "sine",
      frequency: 4, // TODO make customizable
    });

    const amplitude = new GainNode(this.context, {
      gain: note.pitch.toFrequency() / 36,
    });

    oscillator.connect(amplitude);
    oscillator.start(when);

    return amplitude;
  }

  /**
   * Return an audio node that can adjust `playbackRate` of the source node for a bend, if the note has one.
   */
  protected maybeBend(note: notation.Note, playbackRate: AudioParam, tempo: number, when: number) {
    if (!note.bend) {
      return null;
    }

    // TODO why doesn't a constant source node with offset events feeding into the playbackRate param work?

    const duration = noteDurationInSeconds(note, tempo);
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
