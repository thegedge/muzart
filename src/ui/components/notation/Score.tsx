import { observer } from "mobx-react-lite";
import React, { JSX, useEffect } from "react";
import { createKeybindingsHandler } from "tinykeys";
import { useRoute } from "wouter";
import {
  Box,
  DEFAULT_PAGE_HEIGHT,
  DEFAULT_PAGE_WIDTH,
  DEFAULT_SANS_SERIF_FONT_FAMILY,
  LINE_STROKE_WIDTH,
} from "../../../layout";
import { PAGE_MARGIN } from "../../../layout/elements/Part";
import { TABS_NAMESPACE } from "../../storage/namespaces";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { InitialPage, SongTypes } from "../misc/InitialPage";
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

  const [viewingFile, songParams] = useRoute<{ source: SongTypes["source"]; name: string }>("/:from/:name");
  useEffect(() => {
    if (!songParams) {
      return;
    }

    const name = songParams.name;
    switch (songParams.source) {
      case "demo": {
        void application.loadScore(`/songs/${name}`);
        return;
      }
      case "storage": {
        const tabData = application.storage.getBlob(TABS_NAMESPACE, name);
        if (!tabData) {
          throw new Error(`${name} not found in local storage!`);
        }

        const file = new File([tabData], name);
        void application.loadScore(file);
      }
    }
  }, [songParams?.source, songParams?.name]);

  const box =
    (viewingFile ? selection.part?.box : null) ??
    new Box(0, 0, DEFAULT_PAGE_WIDTH + 2 * PAGE_MARGIN, DEFAULT_PAGE_HEIGHT + 2 * PAGE_MARGIN);

  let content: JSX.Element;
  if (viewingFile && selection.part) {
    content = <Part part={selection.part} />;
  } else {
    selection.setScore(null);
    content = <InitialPage box={box} />;
  }

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
