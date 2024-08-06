import * as notation from "@muzart/notation";
import { newPart } from "../actions/editing/part/AddPart";
import { AsyncStorage } from "./Storage";
import { TABS_NAMESPACE } from "./namespaces";

export class EmptyStorage extends AsyncStorage {
  /** @override */
  async loadBlob(namespace: string, subkey: string): Promise<Blob | null> {
    if (namespace != TABS_NAMESPACE) {
      throw new Error(`Unknown empty namespace: ${namespace}`);
    }

    const score = new notation.Score({
      title: "Untitled Tab",
    });
    score.addPart(newPart(score));

    return new File([JSON.stringify(score)], subkey, {
      type: "application/muzart+json",
    });
  }

  /** @override */
  async get(_namespace: string, _subkey: string): Promise<string | null> {
    throw new Error("Can't get empty tabs");
  }

  /** @override */
  async delete(_namespace: string, _subkey: string) {
    throw new Error("Can't delete empty tabs");
  }

  /** @override */
  async set(_namespace: string, _subkey: string, _value: string) {
    throw new Error("Can't store empty tabs");
  }

  /** @override */
  async list(_namespace: string) {
    return [];
  }
}
