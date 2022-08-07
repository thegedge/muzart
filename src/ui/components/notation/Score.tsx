import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { createKeybindingsHandler } from "tinykeys";
import { LINE_STROKE_WIDTH } from "../../../layout/constants";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { PageCallout } from "../layout/PageCallout";
import { Loading } from "../misc/Loading";
import { Part } from "./Part";

const BASE_SCALE = 8;

export const Score = observer(() => {
  const { score, loading, error, selection, playback } = useApplicationState();

  useEffect(() => {
    return () => playback.stop();
  }, [playback]);

  useEffect(() => {
    const listener = createKeybindingsHandler({
      Space: (event) => {
        event.preventDefault();
        playback.togglePlay();
      },
      ArrowLeft: (event) => {
        event.preventDefault();
        selection.previousChord();
      },
      ArrowRight: (event) => {
        event.preventDefault();
        selection.nextChord();
      },
      ArrowUp: (event) => {
        event.preventDefault();
        selection.previousNote();
      },
      ArrowDown: (event) => {
        event.preventDefault();
        selection.nextNote();
      },
    });

    document.body.addEventListener("keydown", listener);

    return () => {
      document.body.removeEventListener("keydown", listener);
    };
  }, [selection, playback]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    throw error; // Let the ErrorBoundary figure it out
  }

  if (score == null) {
    return <PageCallout>Drop a Guitar Pro 4 file here</PageCallout>;
  }

  if (!selection.part) {
    return null;
  }

  const partBox = selection.part.box;
  const viewBox = `0 0 ${partBox.width} ${partBox.height}`;
  const style = {
    width: `${partBox.width * BASE_SCALE}rem`,
    height: `${partBox.height * BASE_SCALE}rem`,
  };

  return (
    <svg className="m-auto" style={style} viewBox={viewBox}>
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
      <Part part={selection.part} />
    </svg>
  );
});
