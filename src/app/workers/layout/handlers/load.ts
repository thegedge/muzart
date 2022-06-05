import { load } from "../../../../loaders";
import { layout } from "../../../layout";
import { LoadEvent } from "../events";

export default async function (event: LoadEvent) {
  const score = await load(event.source);
  const start = performance.now();
  const scoreLayout = layout(score);
  console.log(`Time to lay out full score: ${performance.now() - start}ms`);
  return scoreLayout;
}
