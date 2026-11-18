import { beforeEach, describe, expect, test, vi } from "vitest";
import { AudioWorkletNode } from "../src/nodes/AudioWorkletNode";

class FakeWorklet {
  context = {
    currentTime: 10_000,
  };

  parameters = {
    get(_name: string) {
      throw new Error("not yet implemented for test");
    },
  };

  port = {
    postMessage: vi.fn(),
  };

  connect = vi.fn();
  disconnect = vi.fn();
}

describe("AudioWorkletNode", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe("start", () => {
    test("stops the node after the given duration with an undefined when argument", async () => {
      const worklet = new FakeWorklet();
      const node = new AudioWorkletNode(worklet as unknown as globalThis.AudioWorkletNode);

      node.start(undefined, 10);
      expect(worklet.port.postMessage).toHaveBeenCalledWith({
        type: "start",
        when: undefined,
        durationSecs: 10,
      });

      vi.advanceTimersByTime(10_000);
      expect(worklet.port.postMessage).toHaveBeenCalledWith({ type: "stop" });
    });

    test("stops the node after the given duration with a finite when argument", async () => {
      const worklet = new FakeWorklet();
      const node = new AudioWorkletNode(worklet as unknown as globalThis.AudioWorkletNode);

      node.start(5, 10);
      expect(worklet.port.postMessage).toHaveBeenCalledWith({
        type: "start",
        when: 5,
        durationSecs: 10,
      });

      vi.advanceTimersByTime(5000);
      expect(worklet.port.postMessage).toHaveBeenCalledWith({ type: "stop" });
    });
  });
});
