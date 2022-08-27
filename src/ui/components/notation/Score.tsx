import { observer } from "mobx-react-lite";
import React, { JSX, useEffect } from "react";
import { createKeybindingsHandler } from "tinykeys";
import {
  Box,
  DEFAULT_PAGE_HEIGHT,
  DEFAULT_PAGE_WIDTH,
  DEFAULT_SANS_SERIF_FONT_FAMILY,
  LINE_STROKE_WIDTH,
  STAFF_LINE_HEIGHT,
} from "../../../layout";
import { PAGE_MARGIN } from "../../../layout/elements/Part";
import { TAB_NAMESPACE as TABS_NAMESPACE, VIEW_STATE_NAMESPACE } from "../../storage/namespaces";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { BoxGroup } from "../layout/BoxGroup";
import { Part } from "./Part";

export const Score = observer(() => {
  const application = useApplicationState();
  const { loading, error, selection, playback, storage } = application;

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

  if (error) {
    throw error; // Let the ErrorBoundary figure it out
  }

  let content: JSX.Element;
  const svgProps: JSX.SVGAttributes<SVGSVGElement> = {};
  if (selection.part == null) {
    const partBox = new Box(0, 0, DEFAULT_PAGE_WIDTH + 2 * PAGE_MARGIN, DEFAULT_PAGE_HEIGHT - 2 * PAGE_MARGIN);

    svgProps["viewBox"] = `${partBox.x} ${partBox.y} ${partBox.width} ${partBox.height}`;
    svgProps["style"] = {
      width: `${partBox.width}in`,
      height: `${partBox.height}in`,
    };

    const pageBox = partBox.expand(-PAGE_MARGIN);
    const contentBox = pageBox.expand(-PAGE_MARGIN).translate(-PAGE_MARGIN);
    const textBox = contentBox.translate(-PAGE_MARGIN);
    const fontSize = 6 * STAFF_LINE_HEIGHT;

    let initialContent: JSX.Element;
    if (loading) {
      initialContent = (
        <text
          x={textBox.centerX}
          y={textBox.centerY}
          textAnchor="middle"
          fill="rgb(156, 163, 175)"
          fontWeight="bolder"
          fontSize={fontSize}
        >
          Loading
          <tspan>.</tspan>
          <tspan>.</tspan>
          <tspan>.</tspan>
        </text>
      );
    } else {
      type DemoType = { name: string; key: string; from: "demo" };
      type StorageType = { name: string; key: string; from: "storage" };

      const songs: (DemoType | StorageType)[] = [
        ...storage.list(TABS_NAMESPACE).map((name) => ({ name, key: name, from: "storage" as const })),
        { name: "Demo Song", key: "Song13.gp4", from: "demo" },
      ];

      const lastViewedTab = application.storage.get(VIEW_STATE_NAMESPACE, "lastTab");

      const songList = songs.map((song, index) => {
        const onClick = (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();

          switch (song.from) {
            case "demo": {
              void application.loadScore(`songs/${song.key}`);
              return;
            }
            case "storage": {
              const tabData = application.storage.getBlob(TABS_NAMESPACE, song.name);
              if (!tabData) {
                throw new Error(`${song.name} not found in local storage!`);
              }

              const file = new File([tabData], song.name);
              void application.loadScore(file);
            }
          }
        };

        return (
          <React.Fragment key={index}>
            <tspan
              textAnchor="start"
              fill="#88aaff"
              fontSize={0.4 * fontSize}
              x={textBox.x}
              dy={index == 0 ? fontSize : 0.5 * fontSize}
            >
              ▸{" "}
            </tspan>
            <tspan fontSize={0.4 * fontSize} fill="#88aaff">
              <a href="#" onClick={onClick}>
                {song.name}
                {song.key == lastViewedTab && (
                  <tspan fontStyle="italic" fontWeight={300}>
                    {" "}
                    (last viewed)
                  </tspan>
                )}
              </a>
            </tspan>
          </React.Fragment>
        );
      });

      initialContent = (
        <text
          y={textBox.centerY - 3 * fontSize}
          textAnchor="middle"
          fill="rgb(156, 163, 175)"
          fontWeight="bolder"
          fontSize={fontSize}
        >
          <tspan x={textBox.centerX}>Drop a Guitar Pro 3/4</tspan>
          <tspan x={textBox.centerX} dy={fontSize}>
            file here
          </tspan>
          <tspan x={textBox.centerX} dy={fontSize} fontSize={0.5 * fontSize}>
            or load another file:
          </tspan>
          {songList}
        </text>
      );
    }

    content = (
      <BoxGroup node={{ type: "Page", box: pageBox, parent: null }}>
        <rect width={pageBox.width} height={pageBox.height} fill="#ffffff" style={{ filter: "url(#pageShadow)" }} />
        <BoxGroup node={{ type: "PageContent", box: contentBox, parent: null }} clip>
          {initialContent}
        </BoxGroup>
      </BoxGroup>
    );
  } else {
    const part = selection.part;
    svgProps["viewBox"] = `${part.box.x} ${part.box.y} ${part.box.width} ${part.box.height}`;
    svgProps["style"] = {
      width: `${part.box.width}in`,
      height: `${part.box.height}in`,
    };

    content = <Part part={part} />;
  }

  return (
    <svg
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
