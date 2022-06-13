import { observer } from "mobx-react-lite";
import React, { createRef, useEffect, useMemo } from "react";
import { DEFAULT_MARGIN, LINE_STROKE_WIDTH } from "../../layout";
import { Box } from "../../layout/utils/Box";
import { useApplicationState } from "../utils/ApplicationStateContext";
import { svgBoxProps } from "../utils/svg";

export const SelectionBox = observer(() => {
  const application = useApplicationState();
  const element = application.selection.element;

  const box = useMemo(() => {
    if (!element) {
      return;
    }

    const box = new Box(0, 0, element.box.width, element.box.height); // lazy person's clone
    let e = element;
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

  const ref = createRef<SVGRectElement>();

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ inline: "center", block: "center" });
    }
  }, [element]);

  if (!box) {
    return null;
  }

  const padding = 3 * LINE_STROKE_WIDTH;
  box.x -= padding;
  box.y -= padding;
  box.width += 2 * padding;
  box.height += 2 * padding;

  return <rect {...svgBoxProps(box)} ref={ref} fill="#f0f0a055" strokeWidth={LINE_STROKE_WIDTH} stroke="#c0c080" />;
});
