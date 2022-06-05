import { isWorkerRequestEvent, LoadedEvent, __workerResponseEvent } from "./events";
import handleLoadEvent from "./handlers/load";

self.onmessage = (event: MessageEvent<unknown>) => {
  if (!isWorkerRequestEvent(event)) {
    return;
  }

  switch (event.data.type) {
    case "layout": {
      return;
    }
    case "load": {
      handleLoadEvent(event.data).then((score) => {
        postMessage({
          __workerResponseEvent,
          type: "loaded",
          score,
        } as LoadedEvent);
      });
      return;
    }
  }
};
