import { compact } from "lodash";
import {
  FrequencyClass,
  intervalToFrequencyRatio,
  ToneAudioBuffer,
  ToneAudioBuffers,
  ToneAudioNode,
  ToneBufferSource,
  Vibrato,
} from "tone";
import { ftomf } from "tone/build/esm/core/type/Conversions";
import { MidiNote } from "tone/build/esm/core/type/NoteUnits";
import { Frequency, Interval, NormalRange, Time } from "tone/build/esm/core/type/Units";
import { Instrument as ToneJsInstrument, InstrumentOptions } from "tone/build/esm/instrument/Instrument";
import * as notation from "../../notation";
import { noteValueToSeconds } from "../util/durations";
import { Instrument } from "./Instrument";

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
// Sampler is (currently) mostly derived from the sampler in tone.js, adjusted for
// the notation representation in muzart.

interface SamplerOptions extends InstrumentOptions {
  buffers: Partial<Record<MidiNote, AudioBuffer>>;
}

/**
 * An instrument that takes a set of note buffers and can interpolate all other notes from those.
 */
export class Sampler extends ToneJsInstrument<SamplerOptions> implements Instrument {
  readonly name: string = "Sampler";

  /** The stored and loaded buffers */
  private buffers: ToneAudioBuffers;

  /** The object of all currently playing BufferSources */
  private activeSources: Map<MidiNote, ToneBufferSource[]> = new Map();

  constructor(options: Partial<SamplerOptions>) {
    super(options);

    if (!options.buffers) {
      throw new Error("no sample buffers provided to Sampler");
    }

    this.buffers = new ToneAudioBuffers();
    for (const [note, buffer] of Object.entries(options.buffers)) {
      if (buffer) {
        this.buffers.add(note, buffer);
      }
    }
  }

  /**
   * Clean up all audio resources.
   */
  dispose(): this {
    super.dispose();
    this.buffers.dispose();
    this.activeSources.forEach((sources) => {
      sources.forEach((source) => source.dispose());
    });
    this.activeSources.clear();
    return this;
  }

  /**
   * @param  notes     The note to play, or an array of notes.
   * @param  time     When to play the note
   * @param  velocity The velocity to play the sample back.
   */
  triggerAttack(notes: Frequency | Frequency[], time?: Time, velocity: NormalRange = 1): this {
    if (!Array.isArray(notes)) {
      notes = [notes];
    }

    notes.forEach((note) => {
      this.createToneBufferSource(note, time, velocity).connect(this.output);
    });

    return this;
  }

  triggerRelease(notes: Frequency | Frequency[], time?: Time): this {
    if (!Array.isArray(notes)) {
      notes = [notes];
    }

    notes.forEach((note) => {
      const midi = new FrequencyClass(this.context, note).toMidi();
      // find the note
      if (this.activeSources.has(midi) && (this.activeSources.get(midi) as ToneBufferSource[]).length) {
        const sources = this.activeSources.get(midi) as ToneBufferSource[];
        time = this.toSeconds(time);
        sources.forEach((source) => {
          source.stop(time);
        });
        this.activeSources.set(midi, []);
      }
    });

    return this;
  }

  // TODO figure out if I could just use the regular ToneJS sampler hooked into some output nodes

  playNote(note: notation.Note, time?: Time, _velocity: NormalRange = 1): number | undefined {
    if (note.tie && note.tie.type != "start") {
      return;
    }

    const duration = this.tiedNoteDurationSeconds(note);
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
      this.maybeBend(note, source);

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

  /**
   * Returns the difference in steps between the given midi note at the closets sample.
   */
  private findClosest(midi: MidiNote): Interval {
    // TODO create mapping for MidiNote -> Interval

    // searches within 8 octaves of the given midi note
    const MAX_INTERVAL = 96;
    let interval = 0;
    while (interval < MAX_INTERVAL) {
      // check above and below
      if (this.buffers.has(midi + interval)) {
        return -interval;
      } else if (this.buffers.has(midi - interval)) {
        return interval;
      }
      interval++;
    }
    throw new Error(`No available buffers for note: ${midi}`);
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
    const difference = this.findClosest(midi);
    const closestNote = midi - difference;
    const buffer = this.buffers.get(closestNote);
    const playbackRate = intervalToFrequencyRatio(difference + remainder);

    const source = new ToneBufferSource({
      url: buffer,
      context: this.context,
      curve: "exponential",
      fadeIn: 0,
      fadeOut: 0.1,
      playbackRate,
    });

    source.start(time, 0, buffer.duration / playbackRate, velocity);

    // add it to the active sources
    let sources = this.activeSources.get(midi);
    if (!sources) {
      sources = [];
      this.activeSources.set(midi, sources);
    }
    sources.push(source);

    // remove it when it's done
    source.onended = () => {
      if (this.activeSources && this.activeSources.has(midi)) {
        const sources = this.activeSources.get(midi);
        if (sources) {
          const index = sources.indexOf(source);
          if (index !== -1) {
            sources.splice(index, 1);
            source.buffer.dispose();
            source.dispose();
          }
        }
      }
    };

    return source;
  }

  private maybeBend(note: notation.Note, source: ToneBufferSource) {
    if (!note.bend) {
      return;
    }

    const duration = this.tiedNoteDurationSeconds(note);
    const value = source.playbackRate.value;

    let previousTime = 0;
    for (const { time, amplitude } of note.bend.points) {
      const ratio = intervalToFrequencyRatio(amplitude * 2);
      const bendPointDuration = duration * (time - previousTime);
      source.playbackRate.linearRampTo(value * ratio, bendPointDuration);
      previousTime = time;
    }
  }

  private tiedNoteDurationSeconds(note?: notation.Note) {
    let seconds = 0;

    // TODO get tempo from tab and provide to `noteValueToSeconds` below

    // TODO this is wrong, because the tied note could pass through many other notes, so we need to
    //      also find out all of the durations in between
    while (note) {
      seconds += noteValueToSeconds(note.value);
      note = note.tie?.next;
    }
    return seconds;
  }
}
