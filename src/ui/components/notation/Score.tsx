import { observer } from "mobx-react-lite";
import React, { JSX, useEffect } from "react";
import { createKeybindingsHandler } from "tinykeys";
import {
  Box,
  DEFAULT_PAGE_HEIGHT,
  DEFAULT_PAGE_WIDTH,
  DEFAULT_SANS_SERIF_FONT_FAMILY,
  LINE_STROKE_WIDTH,
} from "../../../layout";
import { PAGE_MARGIN } from "../../../layout/elements/Part";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { InitialPage } from "../misc/InitialPage";
import { Part } from "./Part";

export const Score = observer(() => {
  const application = useApplicationState();
  const { error, selection, playback, debug } = application;

  useEffect(() => {
    return () => playback.stop();
  }, [playback]);

  useEffect(() => {
    const listener = createKeybindingsHandler({
      "Space": (event) => {
        event.preventDefault();
        playback.togglePlay();
      },
      "ArrowLeft": (event) => {
        event.preventDefault();
        selection.previousChord();
      },
      "ArrowRight": (event) => {
        event.preventDefault();
        selection.nextChord();
      },
      "ArrowUp": (event) => {
        event.preventDefault();
        selection.previousNote();
      },
      "ArrowDown": (event) => {
        event.preventDefault();
        selection.nextNote();
      },
      "Shift+D": (event) => {
        event.preventDefault();
        debug.setEnabled(!debug.enabled);
      },
    });

    document.body.addEventListener("keydown", listener);

    return () => {
      document.body.removeEventListener("keydown", listener);
    };
  }, [selection, playback]);

  if (error) {
    throw error; // Let the ErrorBoundary figure it out
  }

  let box: Box;
  let content: JSX.Element;
  if (selection.part == null) {
    box = new Box(0, 0, DEFAULT_PAGE_WIDTH + 2 * PAGE_MARGIN, DEFAULT_PAGE_HEIGHT + 2 * PAGE_MARGIN);
    content = <InitialPage box={box} />;
  } else {
    box = selection.part.box;
    content = <Part part={selection.part} />;
  }

  const svgProps: JSX.SVGAttributes<SVGSVGElement> = {};
  return (
    <svg
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      style={{
        width: `${box.width}in`,
        height: `${box.height}in`,
      }}
      className="m-auto"
      fontFamily={DEFAULT_SANS_SERIF_FONT_FAMILY}
      shapeRendering="geometricPrecision"
      stroke="transparent"
      strokeWidth={LINE_STROKE_WIDTH}
      textRendering="optimizeSpeed"
      {...svgProps}
    >
      <defs>
        <filter id="pageShadow">
          <feDropShadow
            dx={LINE_STROKE_WIDTH * 0}
            dy={LINE_STROKE_WIDTH * 0}
            stdDeviation={LINE_STROKE_WIDTH * 10}
            floodOpacity="0.25"
          />
        </filter>
      </defs>
      {content}
    </svg>
  );
});
