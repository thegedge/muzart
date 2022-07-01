import { DragEvent, useCallback } from "react";

const onDragOver = (e: DragEvent) => e.preventDefault();

export const useDragDropHelpers = (processor: (file: File) => void) => {
  const onDrop = useCallback((event: DragEvent<Element>) => {
    event.preventDefault();

    if (event.dataTransfer.items) {
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        if (event.dataTransfer.items[i].kind === "file") {
          const file = event.dataTransfer.items[i].getAsFile();
          if (file) {
            processor(file);
          }
        }
      }
    } else {
      for (let i = 0; i < event.dataTransfer.files.length; i++) {
        processor(event.dataTransfer.files[i]);
      }
    }
  }, []);

  return {
    onDrop,
    onDragOver,
  };
};
