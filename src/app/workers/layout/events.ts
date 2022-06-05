import { Score } from "../../layout";

export const __workerRequestEvent = "__muzart_workerRequestEvent";
export const __workerResponseEvent = "__muzart_workerResponseEvent";

export interface Event {
  readonly type: string;
}

export interface RequestEvent extends Event {
  readonly __workerRequestEvent: typeof __workerRequestEvent;
}

export interface ResponseEvent extends Event {
  readonly __workerResponseEvent: typeof __workerResponseEvent;
}

export interface LayoutEvent extends RequestEvent {
  readonly type: "layout";
}

export interface LoadEvent extends RequestEvent {
  readonly type: "load";
  readonly source: File | URL | string;
}

export interface LoadedEvent extends ResponseEvent {
  readonly type: "loaded";
  readonly score: Score;
}

export type WorkerRequestEvent = LayoutEvent | LoadEvent;
export type WorkerResponseEvent = LoadedEvent;

export const isWorkerRequestEvent = (event: MessageEvent<unknown>): event is MessageEvent<WorkerRequestEvent> => {
  return (
    typeof event.data == "object" &&
    event.data != null &&
    Reflect.get(event.data, "__workerRequestEvent") == __workerRequestEvent
  );
};

export const isWorkerResponseEvent = (event: MessageEvent<unknown>): event is MessageEvent<WorkerResponseEvent> => {
  return (
    typeof event.data == "object" &&
    event.data != null &&
    Reflect.get(event.data, "__workerResponseEvent") == __workerResponseEvent
  );
};
