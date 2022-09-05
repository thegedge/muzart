import { observer } from "mobx-react-lite";
import React, { useMemo } from "react";
import {
  Box,
  DEFAULT_PAGE_HEIGHT,
  DEFAULT_PAGE_WIDTH,
  DEFAULT_SANS_SERIF_FONT_FAMILY,
  LINE_STROKE_WIDTH,
  STAFF_LINE_HEIGHT,
} from "../../../layout";
import { PAGE_MARGIN } from "../../../layout/elements/Part";
import { TABS_NAMESPACE, VIEW_STATE_NAMESPACE } from "../../storage/namespaces";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { BoxGroup } from "../layout/BoxGroup";
import { SvgRoot } from "./SvgRoot";
import { TextBox, TextBoxLine } from "./TextBox";

const DEFAULT_FONT_SIZE = 6 * STAFF_LINE_HEIGHT;

export type DemoType = { name: string; key: string; source: "demo" };
export type StorageType = { name: string; key: string; source: "storage" };
export type SongTypes = DemoType | StorageType;

export const InitialPage = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  const { loading, storage } = application;

  const box = new Box(0, 0, DEFAULT_PAGE_WIDTH + 2 * PAGE_MARGIN, DEFAULT_PAGE_HEIGHT + 2 * PAGE_MARGIN);
  const pageBox = box.expand(-PAGE_MARGIN);
  const contentBox = pageBox.expand(-PAGE_MARGIN).translate(-PAGE_MARGIN);
  const textBox = contentBox.update({ x: 0, y: 0 }).expand(-PAGE_MARGIN);

  const lines = useMemo((): TextBoxLine[] => {
    if (loading) {
      return [{ text: "Loading..." }];
    }

    const songs: SongTypes[] = [
      ...storage.list(TABS_NAMESPACE).map((name) => ({ name, key: name, source: "storage" as const })),
      { name: "Demo Song", key: "Song13.gp4", source: "demo" },
    ];

    const songLines = songs.map((song): TextBoxLine => {
      const lastViewedTab = application.storage.get(VIEW_STATE_NAMESPACE, "lastTab");
      return {
        text: `▸ ${song.name}${song.key == lastViewedTab ? " (last viewed)" : ""}`,
        fontSize: DEFAULT_FONT_SIZE * 0.4,
        lineHeight: DEFAULT_FONT_SIZE * 0.5,
        color: "#88aaff",
        alignment: "start",
        href: `#/${song.source}/${encodeURIComponent(song.key)}`,
      };
    });

    return [
      { text: "Drop a Guitar Pro 3/4", fontWeight: "bold" },
      { text: "file here", fontWeight: "bold" },
      { text: " " },
      { text: "Or load one from storage:", fontSize: DEFAULT_FONT_SIZE * 0.4, alignment: "start", fontWeight: 200 },
      { text: " ", lineHeight: DEFAULT_FONT_SIZE * 0.2 },
      ...songLines,
      { text: " ", lineHeight: Math.max(0, (8 - songLines.length) * PAGE_MARGIN) },
    ];
  }, [loading, storage]);

  return (
    <SvgRoot box={box}>
      <BoxGroup element={{ type: "Page", box: pageBox, parent: null }}>
        <rect
          width={pageBox.width}
          height={pageBox.height}
          fill="rgb(255, 255, 255)"
          className="stroke-gray-400"
          style={{ filter: "url(#pageShadow)" }}
        />

        <image width={pageBox.width} height={pageBox.height} href="Song13.svg" style={{ filter: "url(#pageBlur)" }} />

        <rect
          width={pageBox.width}
          height={pageBox.height}
          fill="rgb(255, 255, 255, 0.8)"
          className="stroke-gray-400"
          style={{ filter: "url(#pageShadow)" }}
        />

        <rect
          x={0.5 * PAGE_MARGIN}
          y={0.5 * PAGE_MARGIN}
          width={pageBox.width - PAGE_MARGIN}
          height={pageBox.height - PAGE_MARGIN}
          fill="none"
          className="stroke-gray-400"
          strokeWidth={5 * LINE_STROKE_WIDTH}
          strokeDasharray={`${0.2 * PAGE_MARGIN}`}
        />

        <BoxGroup element={{ type: "PageContent", box: contentBox, parent: null }} clip>
          <TextBox
            lines={lines}
            box={textBox}
            fontSize={DEFAULT_FONT_SIZE}
            fontFamily={DEFAULT_SANS_SERIF_FONT_FAMILY}
          />
        </BoxGroup>
      </BoxGroup>
    </SvgRoot>
  );
});
