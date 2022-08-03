import { Score } from "../notation";

export interface Loader {
  load(): Score;
}
