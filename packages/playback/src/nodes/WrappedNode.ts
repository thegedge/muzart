import { AudioNode } from "./AudioNode";

export class WrappedNode extends AudioNode {
  #active = false;

  constructor(readonly raw: globalThis.AudioNode) {
    super();

    this.raw.addEventListener("ended", () => {
      if (this.#active) {
        this.#active = false;
        this.emit("ended").catch(console.error);
      }
    });
  }

  start(when?: number, durationSecs?: number) {
    if (this.raw instanceof AudioScheduledSourceNode) {
      this.#active = true;
      this.raw.start(when);
      if (durationSecs !== undefined) {
        this.raw.stop((when ?? 0) + durationSecs);
      }
    }
  }

  stop() {
    if (this.#active) {
      if (this.raw instanceof AudioScheduledSourceNode) {
        this.raw.stop();
      } else {
        this.raw.disconnect();
      }

      this.#active = false;
      this.emit("ended").catch(console.error);
    }
  }

  dispose() {
    this.raw.disconnect();
  }

  get pitch() {
    if ("frequency" in this.raw) {
      return this.raw.frequency as AudioParam;
    }

    if ("playbackRate" in this.raw) {
      return this.raw.playbackRate as AudioParam;
    }

    return undefined;
  }
}
