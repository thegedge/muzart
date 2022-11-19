import { observer } from "mobx-react-lite";
import { useMemo } from "preact/hooks";
import { DEFAULT_MARGINS, DEFAULT_PAGE_HEIGHT, DEFAULT_PAGE_WIDTH } from "../../../layout";
import { TABS_NAMESPACE, VIEW_STATE_NAMESPACE } from "../../storage/namespaces";
import { useApplicationState } from "../../utils/ApplicationStateContext";

export type DemoType = { name: string; key: string; source: "demo" };
export type StorageType = { name: string; key: string; source: "storage" };
export type SongTypes = DemoType | StorageType;

export const InitialPage = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  const { loading, storage } = application;

  const lines = useMemo(() => {
    if (loading) {
      return [];
    }

    const songs: SongTypes[] = [
      ...storage.list(TABS_NAMESPACE).map((name) => ({ name, key: name, source: "storage" as const })),
      { name: "Demo Song", key: "Song13.gp4", source: "demo" },
    ];

    return songs.map((song) => {
      const lastViewedTab = application.storage.get(VIEW_STATE_NAMESPACE, "lastTab");
      return {
        key: song.key,
        href: `#/${song.source}/${encodeURIComponent(song.key)}`,
        text: `${song.name}${song.key == lastViewedTab ? " (last viewed)" : ""}`,
      };
    });
  }, [loading, storage]);

  return (
    <div className="mx-auto w-fit">
      <div
        class="bg-white text-gray-400 w-fit relative text-xl leading-6"
        style={{
          width: `${DEFAULT_PAGE_WIDTH}mm`,
          height: `${DEFAULT_PAGE_HEIGHT}mm`,
          marginTop: `${DEFAULT_MARGINS.top}mm`,
          marginLeft: `${DEFAULT_MARGINS.left}mm`,
          marginRight: `${DEFAULT_MARGINS.right}mm`,
          marginBottom: `${DEFAULT_MARGINS.bottom}mm`,
          paddingTop: `${0.5 * DEFAULT_MARGINS.top}mm`,
          paddingLeft: `${0.5 * DEFAULT_MARGINS.left}mm`,
          paddingRight: `${0.5 * DEFAULT_MARGINS.right}mm`,
          paddingBottom: `${0.5 * DEFAULT_MARGINS.bottom}mm`,
          overflow: "clip",
        }}
      >
        <img
          src="Song13.svg"
          className="absolute h-full object-cover opacity-20 blur-sm pointer-events-none"
          style={{ marginLeft: `-${0.5 * DEFAULT_MARGINS.left}mm` }}
        />
        <div
          className="flex flex-col justify-center h-full border-dashed border-2 border-gray-400"
          style={{
            paddingTop: `${1.5 * DEFAULT_MARGINS.top}mm`,
            paddingLeft: `${1.5 * DEFAULT_MARGINS.left}mm`,
            paddingRight: `${1.5 * DEFAULT_MARGINS.right}mm`,
            paddingBottom: `${1.5 * DEFAULT_MARGINS.bottom}mm`,
          }}
        >
          <div className="flex-grow flex-shrink" />
          <h1 className="font-bold text-center text-6xl">Drop a Guitar Pro 3/4 file here</h1>
          <p className="my-6 font-extralight">Or load one from storage:</p>
          <ul className="font-light list-inside" style={{ color: "#88aaff" }}>
            {lines.map(({ key, href, text }) => {
              return (
                <li key={key} style={{ listStyleType: '"▸ "' }}>
                  <a href={href}>{text}</a>
                </li>
              );
            })}
          </ul>
          <div className="flex-grow-2 flex-shrink" />
        </div>
      </div>
    </div>
  );
});
