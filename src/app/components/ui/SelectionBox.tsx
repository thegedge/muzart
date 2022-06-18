import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useRef } from "react";
import { DEFAULT_MARGIN, LayoutElement, LINE_STROKE_WIDTH } from "../../layout";
import { Box } from "../../layout/utils/Box";
import { useApplicationState } from "../utils/ApplicationStateContext";
import { svgBoxProps } from "../utils/svg";

// TODO factor out these "relative to absolute" calculations in the useMemo calls below

export const SelectionBox = observer(() => {
  const application = useApplicationState();
  const element = application.selection.element;

  const measureOffsetBox = useMemo(() => {
    if (!element) {
      return;
    }

    const box = new Box(0, 0, 0, 0); // lazy person's clone
    let e: LayoutElement<unknown> | undefined = element;
    while (e && e.box) {
      box.x += e.box.x;
      box.y += e.box.y;

      if (e.type == "Measure") {
        box.width = e.box.width;
        box.height = e.box.height;
        break;
      }

      e = e.parent;
    }

    return box;
  }, [element]);

  const elementBox = useMemo(() => {
    if (!element) {
      return;
    }

    const box = new Box(0, 0, element.box.width, element.box.height); // lazy person's clone
    let e: LayoutElement<unknown> | undefined = element;
    while (e && e.box) {
      // TODO eliminate need for this by making Page have a single group child properly offset
      if (e.type == "Page") {
        box.x += e.box.x + DEFAULT_MARGIN;
        box.y += e.box.y + DEFAULT_MARGIN;
      } else {
        box.x += e.box.x;
        box.y += e.box.y;
      }
      e = e.parent;
    }

    return box;
  }, [element]);

  const ref = useRef<SVGRectElement | null>();

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ inline: "center", block: "center" });
    }
  }, [element]);

  if (!elementBox || !measureOffsetBox) {
    return null;
  }

  if (application.playback.playing) {
    const playbackBox = new Box(
      elementBox.x,
      elementBox.y - measureOffsetBox.y,
      elementBox.width,
      measureOffsetBox.height
    );

    return (
      <rect
        ref={(instance) => {
          ref.current = instance;
        }}
        fill="#ff000033"
        {...svgBoxProps(playbackBox)}
      />
    );
  } else {
    const padding = 3 * LINE_STROKE_WIDTH;
    return (
      <rect
        ref={(instance) => {
          ref.current = instance;
        }}
        fill="#f0f0a055"
        strokeWidth={LINE_STROKE_WIDTH}
        stroke="#c0c080"
        {...svgBoxProps(elementBox.expand(padding))}
      />
    );
  }
});
