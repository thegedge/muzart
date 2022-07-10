import { compact, last } from "lodash";
import { BufferCursor, NumberType } from "../loaders/util/BufferCursor";
import { Pitch } from "../notation";
import { Instrument } from "./instruments/Instrument";
import { Sampler } from "./instruments/Sampler";

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
type Generators = Record<number, number>;

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

interface SoundFontInstrument {
  name: string;
  zoneIndex: number;
  zones: SoundFontZone[];
}

interface SoundFontSample {
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

enum SoundFontGeneratorType {
  Instrument = 41,
  SampleId = 53,
  PitchOverride = 58, // overridingRootKey
}

export class SoundFont {
  static async fromURL(url: string | URL) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new SoundFont(buffer);
  }

  private sampleData!: Float32Array;
  private presets!: SoundFontPreset[];
  private instruments_!: SoundFontInstrument[];
  private samples!: SoundFontSample[];

  constructor(buffer: ArrayBuffer) {
    const cursor = new BufferCursor(buffer);
    this.readRiffChunk(cursor);
  }

  instrument(audioContext: AudioContext, midiPreset: number): Instrument {
    // TODO What are global zones? What should we do for them?

    const preset = this.presets.find((preset) => preset.bank == 0 && preset.midiPreset == midiPreset);
    if (!preset) {
      throw new Error(`soundfont doesn't contain midi preset ${midiPreset}`);
    }

    const zoneWithInstrument = preset.zones.find((zone) => SoundFontGeneratorType.Instrument in zone.generators);
    if (!zoneWithInstrument) {
      throw new Error(`preset ${midiPreset} doesn't have an instrument generator`);
    }

    const instrumentIndex = zoneWithInstrument.generators[SoundFontGeneratorType.Instrument];
    const instrument = this.instruments_[instrumentIndex];
    if (!instrument) {
      throw new Error(`preset ${midiPreset} has invalid instrument generator`);
    }

    const zonesWithSamples = instrument.zones.filter((zone) => SoundFontGeneratorType.SampleId in zone.generators);
    if (!zonesWithSamples) {
      throw new Error(`instrument for preset ${midiPreset} has no sampling generator`);
    }

    const buffers = compact(
      zonesWithSamples.map((zone): [number, AudioBuffer] | undefined => {
        const sampleInfo = this.samples[zone.generators[SoundFontGeneratorType.SampleId]];
        const length = sampleInfo.end - sampleInfo.start;
        const sampleRate = sampleInfo.sampleRate;

        const buffer = audioContext.createBuffer(1, length, sampleRate);
        buffer.copyToChannel(this.sampleData.subarray(sampleInfo.start, sampleInfo.end), 0);

        // TODO find note from root key generator instead of sample name
        const note = last(sampleInfo.sampleName.split("-"));
        if (note) {
          const pitch = Pitch.fromScientificNotation(note);
          return [pitch.toMidi(), buffer];
        }
      })
    );

    return new Sampler({ buffers, context: audioContext });
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
    const end = cursor.position + listChunkSize;

    cursor.nextString(4); // 'INFO'

    while (cursor.position < end) {
      /* const chunkType = */ cursor.nextString(4);
      const chunkSize = cursor.nextNumber(NumberType.Uint32);
      /* const infoString = */ cursor.nextString(chunkSize);
    }
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
      const amount = cursor.nextNumber(NumberType.Uint16);
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
