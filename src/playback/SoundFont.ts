import { compact, uniqBy } from "lodash";
import { BufferCursor, NumberType } from "../loaders/util/BufferCursor";
import * as notation from "../notation";
import { Instrument } from "./instruments/Instrument";
import { Percussion } from "./instruments/Percussion";
import { PitchAdjustableInstrument } from "./instruments/PitchAdjustableInstrument";

interface SoundFontPreset {
  name: string;
  midiPreset: number;
  bank: number;
  zoneIndex: number;
  library: number;
  genre: number;
  morphology: number;

  zones: SoundFontZone[];
}

// TODO eventally key by SoundFontGeneratorType
type Generators = Record<number, number | undefined>;

interface SoundFontZone {
  generators: Generators;
  modulators: SoundFontModulator[];
}

interface SoundFontZoneIndex {
  generatorIndex: number;
  modulatorIndex: number;
}

interface SoundFontModulator {
  sourceModulator: number;
  destinationModulator: number;
  modulatorAmount: number;
  sourceAmountModulator: number;
  modulatorTransform: number;
}

export interface SoundFontInstrument {
  name: string;
  zoneIndex: number;
  zones: SoundFontZone[];
}

export interface SoundFontSample {
  sampleName: string;
  start: number;
  end: number;
  startLoop: number;
  endLoop: number;
  sampleRate: number;
  originalPitch: number;
  pitchCorrection: number;
  sampleLink: number;
  sampleType: number;
}

export interface SampleZone extends SoundFontSample, SoundFontZone {
  buffer: AudioBuffer;
}

export enum SoundFontGeneratorType {
  /** Time of attack phase (seconds) */
  EnvelopeVolumeAttack = 34,

  /** Time of decay phase (seconds) */
  EnvelopeVolumeDecay = 36,

  /** Time from end of attack phase to beginning of decay (seconds) */
  EnvelopeVolumeHold = 35,

  /** Time of decay phase (seconds) */
  EnvelopeVolumeRelease = 38,

  /** The decrease in volume during decay (centibels, 0 meaning no change) */
  EnvelopeVolumeSustain = 37,

  /** Index into the instrument list */
  Instrument = 41,

  /** Range of possible pitches for a sample (midi number) */
  KeyRange = 43,

  /** Overriding root key for samples */
  RootKeyOverride = 58,

  /** A pitch offset to apply to notes */
  CoarseTune = 51,

  /** Index into sample array */
  SampleId = 53,
}

export class SoundFont {
  static async fromSource(source: string | URL | File | Response | ArrayBuffer) {
    let buffer: ArrayBuffer;
    if (typeof source == "string" || source instanceof URL) {
      const response = await fetch(source);
      buffer = await response.arrayBuffer();
    } else if (source instanceof File) {
      buffer = await source.arrayBuffer();
    } else if (source instanceof Response) {
      buffer = await source.arrayBuffer();
    } else {
      buffer = source;
    }

    return new SoundFont(buffer);
  }

  private sampleData!: Float32Array;
  private presets!: SoundFontPreset[];
  private instruments_!: SoundFontInstrument[];
  private samples!: SoundFontSample[];

  constructor(buffer: ArrayBuffer) {
    const cursor = new BufferCursor(buffer);

    // TODO a lot of this could probably be done lazily, just maintaining buffer offsets for the chunks
    this.readRiffChunk(cursor);
  }

  instrument(audioContext: AudioContext, instrument: notation.Instrument): Instrument {
    // TODO Handle global zones and many other things
    // TODO these are hardcoded values for percussion instruments right now (tied to the "GeneralUser GS v1.471" soundfont)

    let bank = 0;
    let midiPreset = instrument.midiPreset;
    if (instrument.type == "percussion") {
      bank = 120;
      midiPreset = 0;
    }

    const preset = this.presets.find((preset) => preset.bank == bank && preset.midiPreset == midiPreset);
    if (!preset) {
      throw new Error(`soundfont doesn't contain midi preset ${midiPreset}`);
    }

    let zonesWithInstrument: SoundFontZone[] = [];
    if (instrument.type == "percussion") {
      zonesWithInstrument = preset.zones.filter((zone) => SoundFontGeneratorType.Instrument in zone.generators);
    } else {
      const zoneWithInstrument = preset.zones.find((zone) => SoundFontGeneratorType.Instrument in zone.generators);
      if (zoneWithInstrument) {
        zonesWithInstrument.push(zoneWithInstrument);
      }
    }

    if (zonesWithInstrument.length == 0) {
      throw new Error(`preset ${midiPreset} doesn't have an instrument generator`);
    }

    const sfInstruments = compact(
      zonesWithInstrument.map((zoneWithInstrument) => {
        const instrumentIndex = zoneWithInstrument.generators[SoundFontGeneratorType.Instrument];
        return instrumentIndex && this.instruments_[instrumentIndex];
      })
    );

    if (sfInstruments.length == 0) {
      throw new Error(`preset ${midiPreset} has invalid instrument generator`);
    }

    const sampleKeyPairs = sfInstruments.flatMap((sfInstrument) => {
      let globalZone: SoundFontZone | undefined = sfInstrument.zones[0];
      const hasGlobalZone = !globalZone?.generators[SoundFontGeneratorType.SampleId];
      if (!hasGlobalZone) {
        globalZone = undefined;
      }

      const zonesWithSamples = sfInstrument.zones.filter((zone) => SoundFontGeneratorType.SampleId in zone.generators);
      return zonesWithSamples.map((zone): [number, SampleZone] | undefined => {
        const sampleIndex = zone.generators[SoundFontGeneratorType.SampleId];
        if (!sampleIndex) {
          return undefined;
        }

        const sampleInfo = this.samples[sampleIndex];
        const length = sampleInfo.end - sampleInfo.start;
        const sampleRate = sampleInfo.sampleRate;

        try {
          // TODO this is potentially wasteful, if multiply of the same key, given the uniqBy below
          const buffer = audioContext.createBuffer(1, length, sampleRate);
          buffer.copyToChannel(this.sampleData.subarray(sampleInfo.start, sampleInfo.end), 0);

          const generators = { ...globalZone?.generators, ...zone.generators };
          const modulators = { ...globalZone?.modulators, ...zone.modulators };

          const basePitch = generators[SoundFontGeneratorType.RootKeyOverride] ?? sampleInfo.originalPitch;
          const pitchOffset = generators[SoundFontGeneratorType.CoarseTune] ?? 0;

          return [
            basePitch - pitchOffset,
            {
              ...sampleInfo,
              generators,
              modulators,
              buffer,
            },
          ];
        } catch (error) {
          console.error(`couldn't create instrument buffer: ${error}`);
        }
      });
    });

    const buffers = uniqBy(compact(sampleKeyPairs), (v) => v[0]);
    if (buffers.length == 0) {
      throw new Error(`instrument for preset ${midiPreset} has no samples`);
    }

    if (instrument.type == "regular") {
      return new PitchAdjustableInstrument({ buffers, instrument, context: audioContext });
    } else {
      return new Percussion({ buffers, instrument, context: audioContext });
    }
  }

  get instruments() {
    return this.presets
      .filter((preset) => preset.bank == 0)
      .map((preset) => ({
        name: preset.name,
        midiPreset: preset.midiPreset,
      }));
  }

  private readRiffChunk(cursor: BufferCursor) {
    cursor.nextString(4); // 'RIFF'
    /* const chunkSize = */ cursor.nextNumber(NumberType.Uint32);
    cursor.nextString(4); // 'sfbk'

    this.readInfoList(cursor);
    this.readSampleDataList(cursor);
    this.readPresetList(cursor);
  }

  private readInfoList(cursor: BufferCursor) {
    cursor.nextString(4); // 'LIST'
    const listChunkSize = cursor.nextNumber(NumberType.Uint32);

    cursor.nextString(4); // 'INFO'

    cursor.skip(listChunkSize - 4);
    // const end = cursor.position + listChunkSize;
    // while (cursor.position < end) {
    //   /* const chunkType = */ cursor.nextString(4);
    //   const chunkSize = cursor.nextNumber(NumberType.Uint32);
    //   /* const infoString = */ cursor.nextString(chunkSize);
    // }
  }

  private readSampleDataList(cursor: BufferCursor) {
    cursor.nextString(4); // 'LIST'
    /* const chunkSize = */ cursor.nextNumber(NumberType.Uint32);
    cursor.nextString(4); // 'sdta'

    // Sample data consists of the smpl chunk (upper 16 bits) and optional sm24 chunk (lower 8 bits)
    cursor.nextString(4); // 'smpl'
    const numSampleBytes = cursor.nextNumber(NumberType.Uint32);
    let samples: Int16Array; // = new Int16Array(numSampleBytes / 2);
    {
      samples = new Int16Array(cursor.buffer, cursor.position, numSampleBytes / 2);
      cursor.skip(numSampleBytes);

      // For performance reasons, we're ignoring the sm24 chunk right now.
      const nextChunk = cursor.nextString(4);
      if (nextChunk == "sm24") {
        const chunkSize = cursor.nextNumber(NumberType.Uint32);
        cursor.skip(chunkSize);
      } else {
        // No sm24 chunk, undo our string read from above
        cursor.skip(-4);
      }
    }

    this.sampleData = new Float32Array(samples.length * 2);

    const divisor = 1 << 15;
    for (let index = 0; index < samples.length; ++index) {
      this.sampleData[index] = samples[index] / divisor;
    }
  }

  private readPresetList(cursor: BufferCursor) {
    {
      cursor.nextString(4); // 'LIST'
      /* const chunkSize = */ cursor.nextNumber(NumberType.Uint32);
      cursor.nextString(4); // 'pdta'
    }

    this.presets = this.readPresets(cursor);
    const presetZones = this.readZones(cursor);
    const presetModulators = this.readModulators(cursor);
    const presetGenerators = this.readGenerators(cursor);
    this.mapZones(this.presets, presetZones, presetGenerators, presetModulators);

    this.instruments_ = this.readInstruments(cursor);
    const instrumentZones = this.readZones(cursor);
    const instrumentModulators = this.readModulators(cursor);
    const instrumentGenerators = this.readGenerators(cursor);
    this.mapZones(this.instruments_, instrumentZones, instrumentGenerators, instrumentModulators);

    this.samples = this.readSamples(cursor);
  }

  private mapZones(
    instances: { zones: SoundFontZone[]; zoneIndex: number }[],
    zoneIndexes: SoundFontZoneIndex[],
    generators: [number, number][],
    modulators: SoundFontModulator[]
  ) {
    for (let instanceIndex = 0; instanceIndex < instances.length; ++instanceIndex) {
      const instance = instances[instanceIndex];
      const endIndex =
        instanceIndex == instances.length - 1 ? zoneIndexes.length : instances[instanceIndex + 1].zoneIndex;

      for (let zoneIndex = instance.zoneIndex; zoneIndex < endIndex; ++zoneIndex) {
        const { generatorIndex, modulatorIndex } = zoneIndexes[zoneIndex];
        const generatorEndIndex =
          zoneIndex == zoneIndexes.length - 1 ? generators.length : zoneIndexes[zoneIndex + 1].generatorIndex;
        const modulatorEndIndex =
          zoneIndex == zoneIndexes.length - 1 ? modulators.length : zoneIndexes[zoneIndex + 1].modulatorIndex;
        instance.zones.push({
          generators: Object.fromEntries(generators.slice(generatorIndex, generatorEndIndex)),
          modulators: modulators.slice(modulatorIndex, modulatorEndIndex),
        });
      }
    }
  }

  private readPresets(cursor: BufferCursor) {
    const presets: SoundFontPreset[] = [];

    cursor.nextString(4); // 'phdr'
    const chunkSize = cursor.nextNumber(NumberType.Uint32);
    const end = cursor.position + chunkSize;

    while (cursor.position < end) {
      const name = cursor.nextNullTerminatedString(20);
      const presetNumber = cursor.nextNumber(NumberType.Uint16);
      const bank = cursor.nextNumber(NumberType.Uint16);
      const zoneIndex = cursor.nextNumber(NumberType.Uint16);
      const library = cursor.nextNumber(NumberType.Uint32);
      const genre = cursor.nextNumber(NumberType.Uint32);
      const morphology = cursor.nextNumber(NumberType.Uint32);

      presets.push({
        name,
        midiPreset: presetNumber,
        bank,
        zoneIndex,
        library,
        genre,
        morphology,
        zones: [],
      });
    }

    return presets;
  }

  private readZones(cursor: BufferCursor) {
    const zones: SoundFontZoneIndex[] = [];

    cursor.nextString(4); // 'pbag' or 'ibag'
    const chunkSize = cursor.nextNumber(NumberType.Uint32);
    const chunkEnd = cursor.position + chunkSize;
    for (let index = 0; cursor.position < chunkEnd; ++index) {
      const generatorIndex = cursor.nextNumber(NumberType.Uint16);
      const modulatorIndex = cursor.nextNumber(NumberType.Uint16);
      zones.push({
        generatorIndex,
        modulatorIndex,
      });
    }

    return zones;
  }

  private readModulators(cursor: BufferCursor) {
    const modulators: SoundFontModulator[] = [];

    cursor.nextString(4); // 'pmod' or 'imod'
    const chunkSize = cursor.nextNumber(NumberType.Uint32);
    const end = cursor.position + chunkSize;
    for (let index = 0; cursor.position < end; ++index) {
      const sourceModulator = cursor.nextNumber(NumberType.Uint16);
      const destinationModulator = cursor.nextNumber(NumberType.Uint16);
      const modulatorAmount = cursor.nextNumber(NumberType.Int16);
      const sourceAmountModulator = cursor.nextNumber(NumberType.Uint16);
      const modulatorTransform = cursor.nextNumber(NumberType.Uint16);
      modulators.push({
        sourceModulator,
        destinationModulator,
        modulatorAmount,
        sourceAmountModulator,
        modulatorTransform,
      });
    }

    return modulators;
  }

  private readGenerators(cursor: BufferCursor): [number, number][] {
    const generators: [number, number][] = [];

    cursor.nextString(4); // 'pgen' or 'igen'
    const chunkSize = cursor.nextNumber(NumberType.Uint32);
    const end = cursor.position + chunkSize;
    for (let index = 0; cursor.position < end; index += 1) {
      const type = cursor.nextNumber(NumberType.Uint16);

      let amount;
      switch (type) {
        case SoundFontGeneratorType.EnvelopeVolumeAttack:
        case SoundFontGeneratorType.EnvelopeVolumeDecay:
        case SoundFontGeneratorType.EnvelopeVolumeHold:
        case SoundFontGeneratorType.EnvelopeVolumeRelease:
          amount = Math.pow(2, cursor.nextNumber(NumberType.Int16) / 1200);
          break;
        case SoundFontGeneratorType.CoarseTune:
          amount = cursor.nextNumber(NumberType.Int16);
          break;
        default:
          amount = cursor.nextNumber(NumberType.Uint16);
          break;
      }
      generators.push([type, amount]);
    }

    return generators;
  }

  private readInstruments(cursor: BufferCursor) {
    const instruments: SoundFontInstrument[] = [];

    cursor.nextString(4); // 'inst'
    const chunkSize = cursor.nextNumber(NumberType.Uint32);
    const end = cursor.position + chunkSize;
    for (let index = 0; cursor.position < end; ++index) {
      const name = cursor.nextNullTerminatedString(20);
      const zoneIndex = cursor.nextNumber(NumberType.Uint16);
      instruments.push({
        name,
        zoneIndex,
        zones: [],
      });
    }

    return instruments;
  }

  private readSamples(cursor: BufferCursor): SoundFontSample[] {
    const samples: SoundFontSample[] = [];

    cursor.nextString(4); // 'shdr'
    const chunkSize = cursor.nextNumber(NumberType.Uint32);
    const end = cursor.position + chunkSize;
    while (cursor.position < end) {
      const sampleName = cursor.nextNullTerminatedString(20);
      const start = cursor.nextNumber(NumberType.Uint32);
      const end = cursor.nextNumber(NumberType.Uint32);
      const startLoop = cursor.nextNumber(NumberType.Uint32);
      const endLoop = cursor.nextNumber(NumberType.Uint32);
      const sampleRate = cursor.nextNumber(NumberType.Uint32);
      const originalPitch = cursor.nextNumber(NumberType.Uint8);
      const pitchCorrection = cursor.nextNumber(NumberType.Int8);
      const sampleLink = cursor.nextNumber(NumberType.Uint16);
      const sampleType = cursor.nextNumber(NumberType.Uint16);
      samples.push({
        sampleName,
        start,
        end,
        startLoop,
        endLoop,
        sampleRate,
        originalPitch,
        pitchCorrection,
        sampleLink,
        sampleType,
      });
    }

    return samples;
  }
}
