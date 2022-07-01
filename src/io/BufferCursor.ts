export class OutOfBoundsError extends Error {
  constructor(message?: string) {
    super(message || "out of bounds");
  }
}

export enum NumberType {
  Int8 = "byte",
  Int16 = "short",
  Int32 = "integer",
  Uint8 = "unsigned byte",
  Uint16 = "unsigned short",
  Uint32 = "unsigned integer",
}

const NUM_BYTES = {
  [NumberType.Int8]: 1,
  [NumberType.Int16]: 2,
  [NumberType.Int32]: 4,
  [NumberType.Uint8]: 1,
  [NumberType.Uint16]: 2,
  [NumberType.Uint32]: 4,
};

export interface Cursor {
  sectionStart(name: string): void;
  sectionEnd(name: string): void;

  nextNumber(type: NumberType): number;
  skip(numBytes?: number): void;
  nextLengthPrefixedString(lengthType?: NumberType): string;
  nextString(length: number): string;
}

export class BufferCursor implements Cursor {
  private byteOffset = 0;
  private view: DataView;
  private decoder = new TextDecoder();

  constructor(readonly buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }

  sectionStart(_name: string) {
    void 0;
  }

  sectionEnd(_name: string) {
    void 0;
  }

  nextNumber(type: NumberType): number {
    const numBytes = NUM_BYTES[type];
    if (this.byteOffset + numBytes >= this.buffer.byteLength) {
      throw new OutOfBoundsError();
    }

    try {
      switch (type) {
        case NumberType.Int8:
          return this.view.getInt8(this.byteOffset);
        case NumberType.Int16:
          return this.view.getInt16(this.byteOffset, true);
        case NumberType.Int32:
          return this.view.getInt32(this.byteOffset, true);
        case NumberType.Uint8:
          return this.view.getUint8(this.byteOffset);
        case NumberType.Uint16:
          return this.view.getUint16(this.byteOffset, true);
        case NumberType.Uint32:
          return this.view.getUint32(this.byteOffset, true);
      }
    } finally {
      this.byteOffset += numBytes;
    }
  }

  /**
   * Load a string from this buffer.
   *
   * The string is encoded as an integral byte, for the length N of the string, followed by N bytes encoding a UTF8 string.
   */
  skip(numBytes = 1): void {
    this.byteOffset += numBytes;
  }

  /**
   * Load a string from this buffer.
   *
   * The string is encoded as an integral byte, for the length N of the string, followed by N bytes encoding a UTF8 string.
   */
  nextLengthPrefixedString(lengthType: NumberType = NumberType.Uint8): string {
    const length = this.nextNumber(lengthType);
    return this.nextString(length);
  }

  /**
   * Load a string from this buffer.
   */
  nextString(length: number): string {
    if (length <= 0) {
      return "";
    }

    if (this.byteOffset + length >= this.buffer.byteLength) {
      throw new OutOfBoundsError();
    }

    const ret = this.decoder.decode(this.buffer.slice(this.byteOffset, this.byteOffset + length));
    this.byteOffset += length;
    return ret;
  }
}
