import Emittery from "emittery";
import { WebAudioNode } from "./node_helpers";

export abstract class AudioNode extends Emittery<{ ended: never }> {
  #tempo = 128;

  /**
   * Start playing a node at a given time and with a given duration.
   *
   * @param when the time to start playing the note, or play immediately if not given
   * @param durationSecs optional duration to play the note for, overriding the note value
   */
  abstract start(when?: number, durationSecs?: number): void;

  /**
   * Immediately stop playing a note.
   */
  abstract stop(): void;

  /**
   * Disconnect any relevant underlying resources for cleanup;
   */
  abstract dispose(): void;

  /**
   * Get the param that can adjust the pitch of this node.
   */
  abstract get pitch(): AudioParam | undefined;

  /**
   * Get the raw, Web Audio node used as output for this node.
   */
  abstract get raw(): WebAudioNode;

  /**
   * Connect to the given destination node.
   */
  connect(destination: AudioNode): this {
    this.raw.connect(destination.raw);
    return this;
  }

  get tempo(): number {
    return this.#tempo;
  }

  set tempo(tempo: number) {
    this.#tempo = tempo;
  }
}
