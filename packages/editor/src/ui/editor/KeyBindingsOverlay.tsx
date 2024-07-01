import { groupBy } from "lodash-es";
import { observer } from "mobx-react-lite";
import { Fragment } from "preact";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { IS_MAC } from "../../utils/platform";
import { KEY_BINDING_SEPARATOR, KeyBindings } from "../../utils/useKeyBindings";

export const KeyBindingsOverlay = observer(function KeyBindingsOverlay<T>(props: { bindings: KeyBindings<T> }) {
  const application = useApplicationState();

  return (
    <div
      className={`z-top absolute bottom-0 left-0 right-0 top-0 flex flex-col gap-4 overflow-clip bg-black/80 p-4 text-gray-300 backdrop-blur-md ${
        application.state.helpVisible ? "block" : "hidden"
      }`}
    >
      <h1 className="flex-none text-center text-2xl font-bold">Keyboard shortcuts</h1>
      <div className="flex flex-1 items-center justify-start overflow-auto">
        <div className="flex h-full flex-col flex-wrap items-stretch justify-start gap-4">
          {Object.entries(groupBy(props.bindings, "group")).map(([groupName, group]) => {
            const bindingsToShow = group.filter((binding) => binding.name && binding.key != "Escape");
            if (bindingsToShow.length == 0) {
              return null;
            }

            return (
              <div key={groupName} className="rounded-lg bg-white/10 px-4 py-2 shadow-lg">
                <h2 className="text-3 mb-2 border-b-2 border-b-white/25 font-bold">{groupName}</h2>
                <div className="grid-cols-key-bindings grid gap-x-4 gap-y-1">
                  {bindingsToShow.map((binding) => (
                    <Fragment key={binding.key}>
                      <KeyBinding binding={binding.key} />
                      <span>{binding.name}</span>
                    </Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

const KeyBinding = (props: { binding: string }) => {
  const pieces = props.binding.split(KEY_BINDING_SEPARATOR);
  return (
    <div className={`grid grid-cols-${pieces.length} w-fit gap-x-0.5`}>
      {pieces.map((piece) => (
        <kbd key={piece}>{presentKey(piece)}</kbd>
      ))}
    </div>
  );
};

const presentKey = (key: string): string => {
  switch (key) {
    case "$mod":
      return IS_MAC ? presentKey("Command") : presentKey("Control");
    case "ArrowDown":
      return "↓";
    case "ArrowLeft":
      return "←";
    case "ArrowRight":
      return "→";
    case "ArrowUp":
      return "↑";
    case "Alt":
      return IS_MAC ? "⌥" : "Alt";
    case "Command":
      return "⌘";
    case "Control":
      return IS_MAC ? "⌃" : "Ctrl";
    case "Return":
      return "⏎";
    case "Shift":
      return IS_MAC ? "⇧" : "Shift";
    case "Space":
    case " ":
      return "␣";
    case "Escape":
      return "Esc";
    default:
      return key;
  }
};
