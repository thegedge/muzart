import { HasBox } from "..";
import Box from "../utils/Box";
import { MaybeLayout } from "./types";

export abstract class Group<T extends MaybeLayout<HasBox>> {
  readonly type = "Group";

  public elements: T[] = [];

  constructor(public box = new Box(0, 0, 0, 0)) {}

  reset() {
    this.elements = [];
    this.box.width = 0;
    this.box.height = 0;
  }
}
