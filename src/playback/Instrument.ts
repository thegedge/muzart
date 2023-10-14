import { compact } from "lodash";
import * as notation from "../notation";
import { InstrumentOptions, SourceGenerator, SourceNode } from "./types";
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
  protected activeSources: Map<number, SourceNode[]> = new Map();

  /** A generator that can produce a source node for a given note */
  protected sourceGenerator: SourceGenerator;

  constructor(options: InstrumentOptions) {
    this.context = options.context;
    this.instrument = options.instrument;
    this.sourceGenerator = options.sourceGenerator;
  }

  /**
   * Stop all actively playing notes
   */
  stop() {
    this.activeSources.forEach((sources) => {
      sources.forEach((source) => {
        if (source.source instanceof AudioWorkletNode) {
          source.source.port.postMessage({ type: "stop" });
        }

        source.source.disconnect();
        source.output.disconnect();
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
  playNote(note: notation.Note, tempo: number, startTimeFromNow?: number, ignoreTies?: boolean) {
    if (note.dead) {
      // TODO produce some percussive-y sound
      return;
    }

    const duration = noteValueToSeconds(note.value, tempo);
    const tieType = note.tie ? note.tie.type : "start";
    const when = this.currentTime + (startTimeFromNow ?? 0);

    try {
      if (tieType == "start") {
        const source = this.sourceGenerator.generate(note, when);
        source.output.connect(this.context.destination);

        // TODO ensure audio worklet nodes always have a frequency param we can adjust
        let pitchParam: AudioParam | undefined = undefined;
        if ("playbackRate" in source.source) {
          pitchParam = source.source.playbackRate;
        } else if ("frequency" in source.source) {
          pitchParam = source.source.frequency;
        }

        if (pitchParam) {
          this.maybeBend(note, pitchParam, tempo, when);

          const vibrato = this.maybeVibrato(note, when);
          const effects: AudioNode[] = compact([vibrato]);
          if (effects.length > 0) {
            effects.reduce((node, previousNode) => {
              node.connect(previousNode);
              return node;
            });
            effects[0].connect(pitchParam);
          }
        }

        let terminateByTimeout = true;
        if (source.source instanceof AudioWorkletNode) {
          // TODO nothing here
        } else if (source.source instanceof OscillatorNode) {
          source.source.start(when);
        } else if (source.source instanceof AudioBufferSourceNode) {
          if (!ignoreTies && note.tie) {
            source.source.start(when, 0);
          } else {
            source.source.start(when, 0, duration + 0.05);
            terminateByTimeout = false;
          }
        }

        if (terminateByTimeout) {
          // TODO better to prodive a duration to generate so the worklet can properly emit an "end"
          setTimeout(
            () => {
              source.source.disconnect();
            },
            1000 * ((startTimeFromNow ?? 0) + noteDurationInSeconds(note, tempo)),
          );
        }

        this.addActiveSource(source, note.pitch.toMidi());
      } else if (tieType == "stop") {
        const pitch = note.get("pitch", true) ?? note.pitch;
        const midi = pitch.toMidi();
        const sources = this.activeSources.get(midi);
        if (sources) {
          // TODO we may want to target one specific source, not all, so perhaps tie these things to notes
          for (const source of sources) {
            source.output.gain.setTargetAtTime(0, when + duration - 0.02, 0.025);
            if ("stop" in source.source) {
              source.source.stop(when + duration + 0.05);
            } else {
              // TODO audio worklet nodes are given a duration
              setTimeout(() => source.source.disconnect(), noteDurationInSeconds(note, tempo) * 1000);
            }
          }
        }
      }
    } catch (e) {
      console.warn(e);
    }

    return duration;
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
   * Track an actively playing source.
   */
  protected addActiveSource(source: SourceNode, midiNote: number) {
    let sources = this.activeSources.get(midiNote);
    if (!sources) {
      sources = [];
      this.activeSources.set(midiNote, sources);
    }
    sources.push(source);

    const closureSources = sources;
    source.source.addEventListener("ended", () => {
      const index = closureSources.findIndex((value) => value.source == source.source);
      if (index !== -1) {
        closureSources.splice(index, 1);
        source.source.disconnect();
        source.output.disconnect();
      }
    });
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
