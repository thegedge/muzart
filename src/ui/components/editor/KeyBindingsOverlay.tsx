import { observer } from "mobx-react-lite";
import { Fragment } from "preact";
import { IS_MAC } from "../../../utils/platform";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { KeyBindingGroups } from "./useEditorKeyBindings";

export const KeyBindingsOverlay = observer((props: { bindings: KeyBindingGroups }) => {
  const application = useApplicationState();

  return (
    <div
      className={`absolute z-50 bg-black/80 backdrop-blur-md text-gray-300 top-0 bottom-0 left-0 right-0 overflow-clip p-4 ${
        application.showHelp ? "block" : "hidden"
      }`}
    >
      <h1 className="text-2xl my-4 font-bold text-center">Keyboard shortcuts</h1>
      <div className="flex items-center justify-start w-full h-full overflow-auto">
        <div className="flex flex-col flex-wrap gap-4 justify-start items-stretch h-full">
          {Object.entries(props.bindings).map(([groupName, group]) => {
            const bindingsWithName = Object.entries(group).filter(([_binding, { name }]) => !!name);
            if (bindingsWithName.length == 0) {
              return null;
            }

            return (
              <div key={groupName} className="rounded-lg py-2 px-4 bg-white/10">
                <h2 className="text-3 font-bold mb-2 border-b-2 border-b-white/25">{groupName}</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {bindingsWithName.map(([binding, { name }]) => (
                    <Fragment key={binding}>
                      <div>
                        <KeyBinding binding={binding} />
                      </div>
                      <span>{name}</span>
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
  const pieces = props.binding.split("+");
  return (
    <div className={`grid grid-cols-${pieces.length} gap-x-0.5 w-fit`}>
      {pieces.map((piece) => (
        <span className="inline-block border rounded border-b-2 px-1 text-center min-w-ex">{presentKey(piece)}</span>
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
    default:
      return key;
  }
};
