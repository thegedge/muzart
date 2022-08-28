import React, { useMemo } from "react";
import { Box, STAFF_LINE_HEIGHT } from "../../../layout";
import { PAGE_MARGIN } from "../../../layout/elements/Part";
import { TABS_NAMESPACE, VIEW_STATE_NAMESPACE } from "../../storage/namespaces";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { BoxGroup } from "../layout/BoxGroup";
import { TextBox, TextBoxLine } from "./TextBox";

const DEFAULT_FONT_SIZE = 6 * STAFF_LINE_HEIGHT;

type DemoType = { name: string; key: string; from: "demo" };
type StorageType = { name: string; key: string; from: "storage" };

export function InitialPage(props: { box: Box }) {
  const application = useApplicationState();
  const { loading, storage } = application;

  const pageBox = props.box.expand(-PAGE_MARGIN);
  const contentBox = pageBox.expand(-PAGE_MARGIN).translate(-PAGE_MARGIN);
  const textBox = contentBox.translate(-PAGE_MARGIN);

  const lines = useMemo((): TextBoxLine[] => {
    if (loading) {
      return [{ text: "Loading..." }];
    }

    const songs: (DemoType | StorageType)[] = [
      ...storage.list(TABS_NAMESPACE).map((name) => ({ name, key: name, from: "storage" as const })),
      { name: "Demo Song", key: "Song13.gp4", from: "demo" },
    ];

    const songLines = songs.map((song): TextBoxLine => {
      const openSong = (event: MouseEvent) => {
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

      const lastViewedTab = application.storage.get(VIEW_STATE_NAMESPACE, "lastTab");
      return {
        text: `▸ ${song.name}${song.key == lastViewedTab ? " (last viewed)" : ""}`,
        fontSize: DEFAULT_FONT_SIZE * 0.4,
        lineHeight: DEFAULT_FONT_SIZE * 0.5,
        color: "#88aaff",
        alignment: "start",
        onClick: openSong,
      };
    });

    return [
      { text: "Drop a Guitar Pro 3/4" },
      { text: "file here" },
      { text: " " },
      { text: "Or load one from storage:", fontSize: DEFAULT_FONT_SIZE * 0.4, alignment: "start" },
      { text: " ", lineHeight: DEFAULT_FONT_SIZE * 0.2 },
      ...songLines,
    ];
  }, [storage]);

  return (
    <BoxGroup node={{ type: "Page", box: pageBox, parent: null }}>
      <rect width={pageBox.width} height={pageBox.height} fill="#ffffff" style={{ filter: "url(#pageShadow)" }} />
      <BoxGroup node={{ type: "PageContent", box: contentBox, parent: null }} clip>
        <TextBox lines={lines} box={textBox} fontSize={DEFAULT_FONT_SIZE} />
      </BoxGroup>
    </BoxGroup>
  );
}
