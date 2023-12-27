import { observer } from "mobx-react-lite";
import { useReducer } from "preact/hooks";
import { DEFAULT_MARGINS, DEFAULT_PAGE_HEIGHT, DEFAULT_PAGE_WIDTH } from "../../../layout";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { useAsync } from "../../utils/useAsync";

export const InitialPage = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  const { loading, tabStorage } = application;
  const [epoch, refresh] = useReducer<number, void>((v) => v + 1, 0);

  const { value: lines, error } = useAsync(async () => {
    if (loading) {
      return [];
    }

    const tabs = await tabStorage.list();
    return tabs.map((tab) => {
      return {
        key: tab,
        href: `#/${encodeURIComponent(tab.toString())}`,
        text: tab.pathname,
        remove: tab.protocol == "demo:" ? null : () => tabStorage.delete(tab),
      };
    });
  }, [loading, tabStorage, epoch]);

  if (error) {
    throw error;
  }

  if (!lines) {
    return null;
  }

  return (
    <div className="mx-auto w-fit">
      <div
        class="relative w-fit bg-white text-xl leading-6 text-gray-400"
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
          className="pointer-events-none absolute h-full object-cover opacity-20 blur-sm"
          style={{ marginLeft: `-${0.5 * DEFAULT_MARGINS.left}mm` }}
        />
        <div
          className="flex h-full flex-col justify-center border-2 border-dashed border-gray-400"
          style={{
            paddingTop: `${1.5 * DEFAULT_MARGINS.top}mm`,
            paddingLeft: `${1.5 * DEFAULT_MARGINS.left}mm`,
            paddingRight: `${1.5 * DEFAULT_MARGINS.right}mm`,
            paddingBottom: `${1.5 * DEFAULT_MARGINS.bottom}mm`,
          }}
        >
          <div className="flex-shrink flex-grow" />
          <h1 className="text-center text-6xl font-bold">Drop a Guitar Pro 3/4 file here</h1>
          <p className="my-6 font-extralight">Or load one from storage:</p>
          <ul className="list-inside font-light" style={{ color: "#88aaff" }}>
            {lines.map(({ key, href, text, remove }) => {
              return (
                <li key={key} style={{ listStyleType: "none" }}>
                  <div className="flex w-full items-center p-1 hover:bg-gray-50">
                    <a className="flex-1" href={href}>
                      ▸ {text}
                    </a>
                    {remove && (
                      <a
                        href="#"
                        className="inline-flex items-center justify-center rounded-sm px-2 py-1 hover:bg-gray-200"
                        onClick={(e) => {
                          e.preventDefault();
                          refresh();
                          void remove();
                        }}
                      >
                        ✕
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex-shrink flex-grow-2" />
        </div>
      </div>
    </div>
  );
});
