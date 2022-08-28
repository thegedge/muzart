import React, { JSX } from "react";
import { Box, STAFF_LINE_HEIGHT } from "../../../layout";
import { PAGE_MARGIN } from "../../../layout/elements/Part";
import { TABS_NAMESPACE, VIEW_STATE_NAMESPACE } from "../../storage/namespaces";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { BoxGroup } from "../layout/BoxGroup";

export function InitialPage(props: { box: Box }) {
  const application = useApplicationState();
  const { loading, storage } = application;

  const pageBox = props.box.expand(-PAGE_MARGIN);
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
            <a href="#" onClick={openSong}>
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

  return (
    <BoxGroup node={{ type: "Page", box: pageBox, parent: null }}>
      <rect width={pageBox.width} height={pageBox.height} fill="#ffffff" style={{ filter: "url(#pageShadow)" }} />
      <BoxGroup node={{ type: "PageContent", box: contentBox, parent: null }} clip>
        {initialContent}
      </BoxGroup>
    </BoxGroup>
  );
}
