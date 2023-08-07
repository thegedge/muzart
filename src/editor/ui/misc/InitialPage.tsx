import { observer } from "mobx-react-lite";
import { useReducer } from "preact/hooks";
import { DEFAULT_MARGINS, DEFAULT_PAGE_HEIGHT, DEFAULT_PAGE_WIDTH } from "../../../layout";
import {
  CREDENTIALS_ACCESS_TOKEN_KEY,
  CREDENTIALS_NAMESPACE,
  useApplicationState,
} from "../../utils/ApplicationStateContext";
import { useAsync } from "../../utils/useAsync";

export const InitialPage = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  const { loading, tabStorage } = application;
  const [epoch, refresh] = useReducer<number, void>((v) => v + 1, 0);

  const { value: lines, error } = useAsync(async () => {
    if (loading) {
      return [];
    }

    const accessToken = application.settingsStorage.get(CREDENTIALS_NAMESPACE, CREDENTIALS_ACCESS_TOKEN_KEY);
    if (accessToken) {
      const qs = new URLSearchParams({
        q: "'1oNKcqJcdqQK1a0KTunvH248lpZE6GhEf' in parents",
      });
      console.log(qs.toString());
      const result = await fetch(`https://www.googleapis.com/drive/v3/files?${qs.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log(await result.json());
    }

    return songs.map((song) => {
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
          <p className="mb-2 mt-8 font-extralight">Or load one from storage:</p>
          <ul className="ml-4 list-inside font-light">
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
                        className="inline-flex items-center justify-center rounded-sm px-1 hover:bg-gray-200"
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
          <form className="my-2 font-extralight" method="GET" action="https://accounts.google.com/o/oauth2/v2/auth">
            {/* TODO use &state=nonce=abc to secure (put nonce in local storage) */}
            <input
              type="hidden"
              name="scope"
              value="https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file"
            />
            <input type="hidden" name="response_type" value="token" />
            <input type="hidden" name="redirect_uri" value={window.location.origin} />
            <input
              type="hidden"
              name="client_id"
              value="995501547133-mvfsrof38ca1p2jkoe0j7lsdp2jmp3jf.apps.googleusercontent.com"
            />
            Or <button className="underline">connect Google Drive storage</button>
          </form>
          <div className="flex-shrink flex-grow-2" />
        </div>
      </div>
    </div>
  );
});
