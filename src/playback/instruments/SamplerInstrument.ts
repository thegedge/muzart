import { memoize } from "lodash";
import * as notation from "../../notation";
import { SampleZone, SoundFontGeneratorType } from "../SoundFont";
import { noteValueToSeconds } from "../util/durations";
import { Instrument } from "./Instrument";

interface SamplerOptions {
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

    try {
      if (tieType == "start") {
        const midi = note.pitch.toMidi();
        const [sample, offset] = this.findClosest(midi);
        const source = this.createToneBufferSource(sample, offset);

        //---------------------------------------------------------------------------------------------

        const bend = this.maybeBend(note);
        if (bend) {
          // TODO connect to something
        }

        //---------------------------------------------------------------------------------------------

        const volume = this.context.createGain();

        const attack = sample.generators[SoundFontGeneratorType.EnvelopeVolumeAttack];
        const hold = sample.generators[SoundFontGeneratorType.EnvelopeVolumeHold];
        const decay = sample.generators[SoundFontGeneratorType.EnvelopeVolumeDecay];
        const release = sample.generators[SoundFontGeneratorType.EnvelopeVolumeRelease];
        // const sustain = sample.generators[SoundFontGeneratorType.EnvelopeVolumeSustain];

        this.createEnvelope(volume.gain, { attack, hold, decay, release });

        //---------------------------------------------------------------------------------------------
        // Connect all the things

        source.connect(volume);
        volume.connect(this.context.destination);

        const vibrato = this.maybeVibrato(note);
        if (vibrato) {
          vibrato.connect(source.playbackRate);
        }

        //---------------------------------------------------------------------------------------------

        const when = this.currentTime + (startTimeFromNow ? startTimeFromNow : 0);
        source.start(when, 0, note.tie ? undefined : duration);
        this.addActiveSource(source, volume, note.pitch.toMidi());
      } else if (tieType == "stop") {
        const midi = note.pitch.toMidi();
        const sources = this.activeSources.get(midi);
        if (sources) {
          const when = this.currentTime + (startTimeFromNow ? startTimeFromNow : 0);
          for (const source of sources) {
            source.audio.stop(when + duration);
          }
        }
      }
    } catch (e) {
      console.warn(e);
    }

    return duration;
  }

  private createEnvelope(param: AudioParam, envelope: Partial<Envelope>) {
    const { attack, hold, decay, release } = envelope;

    let currentEnvelopeTime = this.currentTime;
    if (attack) {
      param.setValueAtTime(0, currentEnvelopeTime);
      param.linearRampToValueAtTime(1, currentEnvelopeTime + attack);
      currentEnvelopeTime += attack;
    } else {
      param.setValueAtTime(1, currentEnvelopeTime);
    }

    if (hold) {
      currentEnvelopeTime += hold;
    }

    if (decay) {
      // TODO use sustain value, if we can somehow set decibel output
      param.linearRampToValueAtTime(0.5, currentEnvelopeTime + decay);
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

  private maybeVibrato(note: notation.Note) {
    if (!note.vibrato) {
      return null;
    }

    const oscillator = this.context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = 4; // TODO make customizable

    // Why does this value work?
    const amplitude = this.context.createGain();
    amplitude.gain.value = Math.pow(2, -6);

    oscillator.connect(amplitude);
    oscillator.start();

    return amplitude;
  }

  private maybeBend(note: notation.Note) {
    if (!note.bend) {
      return null;
    }

    // const duration = this.tiedNoteDurationSeconds(note);
    // const value = source.playbackRate.value;
    // let previousTime = 0;
    // for (const { time, amplitude } of note.bend.points) {
    //   const ratio = intervalToFrequencyRatio(amplitude * 2);
    //   const bendPointDuration = duration * (time - previousTime);
    //   source.playbackRate.linearRampTo(value * ratio, bendPointDuration);
    //   previousTime = time;
    // }
  }
}
