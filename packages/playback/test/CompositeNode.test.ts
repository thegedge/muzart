import { describe, expect, test, vi } from "vitest";
import { AudioNode } from "../src/nodes/AudioNode";
import { CompositeNode, type Chain } from "../src/nodes/CompositeNode";
import type { WebAudioNode } from "../src/nodes/node_helpers";

class FakeNode extends AudioNode {
  disposed = 0;
  readonly raw = {} as WebAudioNode;
  readonly pitch = undefined;

  start() {}
  stop() {}
  dispose() {
    this.disposed++;
  }
}

describe("CompositeNode", () => {
  test("forwards ended from its input exactly once", async () => {
    const [input, middle, output] = [new FakeNode(), new FakeNode(), new FakeNode()];
    const composite = new CompositeNode(input, middle, output);
    const ended = vi.fn();
    composite.on("ended", ended);

    composite.start();
    await input.emit("ended");
    await input.emit("ended");

    expect(ended).toHaveBeenCalledTimes(1);
  });

  test("dispose disposes every node in the chain", () => {
    const nodes: Chain<FakeNode> = [new FakeNode(), new FakeNode(), new FakeNode(), new FakeNode()];
    const composite = new CompositeNode(...nodes);

    composite.dispose();

    expect(nodes.map((node) => node.disposed)).toEqual([1, 1, 1, 1]);
  });
});
