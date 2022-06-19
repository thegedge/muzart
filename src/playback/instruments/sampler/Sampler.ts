import { compact, defaults } from "lodash";
import {
  FrequencyClass,
  intervalToFrequencyRatio,
  isNote,
  SamplerOptions,
  ToneAudioBuffer,
  ToneAudioBuffers,
  ToneAudioNode,
  ToneBufferSource,
  ToneBufferSourceCurve,
  Vibrato,
} from "tone";
import { ftomf } from "tone/build/esm/core/type/Conversions";
import { MidiNote } from "tone/build/esm/core/type/NoteUnits";
import { Frequency, Interval, NormalRange, Time } from "tone/build/esm/core/type/Units";
import { assert } from "tone/build/esm/core/util/Debug";
import { noOp } from "tone/build/esm/core/util/Interface";
import { Instrument } from "tone/build/esm/instrument/Instrument";
import * as notation from "../../../notation";
import { noteValueToSeconds } from "../../util/durations";

export interface SamplesMap {
  [note: string]: ToneAudioBuffer | AudioBuffer | string;
  [midi: number]: ToneAudioBuffer | AudioBuffer | string;
}

//--------------------------------------------------------------------------------
// MIT License
//
// Copyright (c) 2014-2020 Yotam Mann
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//--------------------------------------------------------------------------------
//
// Sampler is (currently) mostly derived from the sampler in tone.js.
//

/**
 * Pass in an object which maps the note's pitch or midi value to the url,
 * then you can trigger the attack and release of that note like other instruments.
 * By automatically repitching the samples, it is possible to play pitches which
 * were not explicitly included which can save loading time.
 *
 * For sample or buffer playback where repitching is not necessary,
 * use [[Player]].
 * @example
 * const sampler = new Tone.Sampler({
 * 	urls: {
 * 		A1: "A1.mp3",
 * 		A2: "A2.mp3",
 * 	},
 * 	baseUrl: "https://tonejs.github.io/audio/casio/",
 * 	onload: () => {
 * 		sampler.triggerAttackRelease(["C1", "E1", "G1", "B1"], 0.5);
 * 	}
 * }).toDestination();
 * @category Instrument
 */
export class Sampler extends Instrument<SamplerOptions> {
  readonly name: string = "Sampler";

  /**
   * The stored and loaded buffers
   */
  private _buffers: ToneAudioBuffers;

  /**
   * The object of all currently playing BufferSources
   */
  private _activeSources: Map<MidiNote, ToneBufferSource[]> = new Map();

  /**
   * The envelope applied to the beginning of the sample.
   * @min 0
   * @max 1
   */
  // @timeRange(0)
  attack: Time;

  /**
   * The envelope applied to the end of the envelope.
   * @min 0
   * @max 1
   */
  // @timeRange(0)
  release: Time;

  /**
   * The shape of the attack/release curve.
   * Either "linear" or "exponential"
   */
  curve: ToneBufferSourceCurve;

  /**
   * @param samples An object of samples mapping either Midi Note Numbers or
   * 			Scientific Pitch Notation to the url of that sample.
   * @param options The remaining options associated with the sampler
   */
  constructor(options: Partial<SamplerOptions>) {
    super(defaults({}, options, Sampler.getDefaults()));

    const parsedOptions = defaults({}, options, Sampler.getDefaults());
    if (!parsedOptions.urls || Object.getOwnPropertyNames(parsedOptions.urls).length == 0) {
      throw new Error("No sample URLs given");
    }

    const urlMap: Record<number, ToneAudioBuffer | AudioBuffer | string> = {};
    Object.keys(parsedOptions.urls).forEach((note) => {
      const noteNumber = parseInt(note, 10);
      if (isNote(note)) {
        const mid = new FrequencyClass(this.context, note).toMidi();
        urlMap[mid] = parsedOptions.urls[note];
      } else if (Number.isFinite(noteNumber)) {
        urlMap[noteNumber] = parsedOptions.urls[noteNumber];
      } else {
        throw new Error(`url key is neither a note or midi pitch: ${note}`);
      }
    });

    this._buffers = new ToneAudioBuffers({
      urls: urlMap,
      onload: parsedOptions.onload,
      baseUrl: parsedOptions.baseUrl,
      onerror: parsedOptions.onerror,
    });
    this.attack = parsedOptions.attack;
    this.release = parsedOptions.release;
    this.curve = parsedOptions.curve;

    // invoke the callback if it's already loaded
    if (this._buffers.loaded) {
      // invoke onload deferred
      void Promise.resolve().then(parsedOptions.onload);
    }
  }

  static getDefaults(): SamplerOptions {
    return Object.assign(Instrument.getDefaults(), {
      attack: 0,
      baseUrl: "",
      curve: "exponential" as const,
      onload: noOp,
      onerror: noOp,
      release: 0.1,
      urls: {},
    });
  }

  /**
   * Returns the difference in steps between the given midi note at the closets sample.
   */
  private findClosest(midi: MidiNote): Interval {
    // searches within 8 octaves of the given midi note
    const MAX_INTERVAL = 96;
    let interval = 0;
    while (interval < MAX_INTERVAL) {
      // check above and below
      if (this._buffers.has(midi + interval)) {
        return -interval;
      } else if (this._buffers.has(midi - interval)) {
        return interval;
      }
      interval++;
    }
    throw new Error(`No available buffers for note: ${midi}`);
  }

  /**
   * @param  notes	The note to release, or an array of notes.
   * @param  time     	When to release the note.
   */
  triggerRelease(notes: Frequency | Frequency[], time?: Time): this {
    this.log("triggerRelease", notes, time);
    if (!Array.isArray(notes)) {
      notes = [notes];
    }
    notes.forEach((note) => {
      const midi = new FrequencyClass(this.context, note).toMidi();
      // find the note
      if (this._activeSources.has(midi) && (this._activeSources.get(midi) as ToneBufferSource[]).length) {
        const sources = this._activeSources.get(midi) as ToneBufferSource[];
        time = this.toSeconds(time);
        sources.forEach((source) => {
          source.stop(time);
        });
        this._activeSources.set(midi, []);
      }
    });
    return this;
  }

  sync(): this {
    if (this._syncState()) {
      this._syncMethod("triggerAttack", 1);
      this._syncMethod("triggerRelease", 1);
    }
    return this;
  }

  /**
   * Invoke the attack phase, then after the duration, invoke the release.
   * @param  notes	The note to play and release, or an array of notes.
   * @param  duration The time the note should be held
   * @param  time     When to start the attack
   * @param  velocity The velocity of the attack
   */
  triggerAttackRelease(
    notes: Frequency[] | Frequency,
    duration: Time | Time[],
    time?: Time,
    velocity: NormalRange = 1
  ): this {
    const computedTime = this.toSeconds(time);
    this.triggerAttack(notes, computedTime, velocity);
    if (Array.isArray(duration)) {
      assert(Array.isArray(notes), "notes must be an array when duration is array");
      (notes as Frequency[]).forEach((note, index) => {
        const d = duration[Math.min(index, duration.length - 1)];
        this.triggerRelease(note, computedTime + this.toSeconds(d));
      });
    } else {
      this.triggerRelease(notes, computedTime + this.toSeconds(duration));
    }
    return this;
  }

  /**
   * Clean up all audio resources.
   */
  dispose(): this {
    super.dispose();
    this._buffers.dispose();
    this._activeSources.forEach((sources) => {
      sources.forEach((source) => source.dispose());
    });
    this._activeSources.clear();
    return this;
  }

  //------------------------------------------------------------------------------------------------

  /**
   * @param  notes	The note to play, or an array of notes.
   * @param  time     When to play the note
   * @param  velocity The velocity to play the sample back.
   */
  triggerAttack(notes: Frequency | Frequency[], time?: Time, velocity: NormalRange = 1): this {
    this.log("triggerAttack", notes, time, velocity);
    if (!Array.isArray(notes)) {
      notes = [notes];
    }
    notes.forEach((note) => {
      this.createToneBufferSource(note, time, velocity).connect(this.output);
    });
    return this;
  }

  // TODO figure out if I could just use the regular ToneJS sampler hooked into some output nodes

  playNote(note: notation.Note, time?: Time, _velocity: NormalRange = 1): number | undefined {
    if (note.tie && note.tie.type != "start") {
      return;
    }

    const duration = tiedNoteDurationSeconds(note);
    const pitch = note.pitch.toString();
    const computedTime = this.toSeconds(time);

    try {
      const source = this.createToneBufferSource(pitch, time);
      const chain: (ToneAudioNode | undefined)[] = [];

      if (note.dead) {
        this.triggerRelease(pitch, computedTime + 0.05);
      } else {
        this.triggerRelease(pitch, computedTime + duration);
      }

      // TODO Could this be another node, instead of mutating the ToneBufferSource?
      maybeBend(note, source);

      chain.push(source, this.maybeVibrato(note));

      compact(chain)
        .reduce((previous, current) => {
          previous.connect(current);
          return current;
        })
        .connect(this.output);
    } catch (e) {
      // No available buffers
      console.warn(e);
    }

    return duration;
  }

  private maybeVibrato(note: notation.Note) {
    if (!note.vibrato) {
      return;
    }

    return new Vibrato({
      context: this.context,
      frequency: 4, // TODO customizable?
      depth: 0.5,
    });
  }

  private createToneBufferSource(note: Frequency, time?: Time, velocity: NormalRange = 1): ToneBufferSource {
    const midiFloat = ftomf(new FrequencyClass(this.context, note).toFrequency());
    const midi = Math.round(midiFloat) as MidiNote;
    const remainder = midiFloat - midi;
    // find the closest note pitch
    const difference = this.findClosest(midi);
    const closestNote = midi - difference;
    const buffer = this._buffers.get(closestNote);
    const playbackRate = intervalToFrequencyRatio(difference + remainder);

    const source = new ToneBufferSource({
      url: buffer,
      context: this.context,
      curve: this.curve,
      fadeIn: this.attack,
      fadeOut: this.release,
      playbackRate,
    });
    source.start(time, 0, buffer.duration / playbackRate, velocity);

    // add it to the active sources
    if (!Array.isArray(this._activeSources.get(midi))) {
      this._activeSources.set(midi, []);
    }
    (this._activeSources.get(midi) as ToneBufferSource[]).push(source);

    // remove it when it's done
    source.onended = () => {
      if (this._activeSources && this._activeSources.has(midi)) {
        const sources = this._activeSources.get(midi) as ToneBufferSource[];
        const index = sources.indexOf(source);
        if (index !== -1) {
          sources.splice(index, 1);
        }
      }
    };

    return source;
  }
}

function maybeBend(note: notation.Note, source: ToneBufferSource) {
  if (!note.bend) {
    return;
  }

  const duration = tiedNoteDurationSeconds(note);
  const value = source.playbackRate.value;

  let previousTime = 0;
  for (const { time, amplitude } of note.bend.points) {
    const ratio = intervalToFrequencyRatio(amplitude * 2);
    const bendPointDuration = duration * (time - previousTime);
    source.playbackRate.linearRampTo(value * ratio, bendPointDuration);
    previousTime = time;
  }
}

function tiedNoteDurationSeconds(note?: notation.Note) {
  let seconds = 0;
  while (note) {
    seconds += noteValueToSeconds(note.value);
    note = note.tie?.next;
  }
  return seconds;
}
