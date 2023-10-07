import { observer } from "mobx-react-lite";
import { Fragment } from "preact";
import { IS_MAC } from "../../../utils/platform";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { KEY_BINDING_SEPARATOR, KeyBindingGroups } from "../../utils/useEditorKeyBindings";

export const KeyBindingsOverlay = observer((props: { bindings: KeyBindingGroups }) => {
  const application = useApplicationState();

  return (
    <div
      className={`flex flex-col gap-4 absolute z-top bg-black/80 backdrop-blur-md text-gray-300 top-0 bottom-0 left-0 right-0 overflow-clip p-4 ${
        application.state.helpVisible ? "block" : "hidden"
      }`}
    >
      <h1 className="flex-none text-2xl font-bold text-center">Keyboard shortcuts</h1>
      <div className="flex-1 flex items-center justify-start overflow-auto">
        <div className="flex flex-col flex-wrap gap-4 justify-start items-stretch h-full">
          {Object.entries(props.bindings).map(([groupName, group]) => {
            const bindingsWithName = Object.entries(group).filter(([_binding, { name }]) => !!name);
            if (bindingsWithName.length == 0) {
              return null;
            }

            return (
              <div key={groupName} className="rounded-lg py-2 px-4 bg-white/10 shadow-lg">
                <h2 className="text-3 font-bold mb-2 border-b-2 border-b-white/25">{groupName}</h2>
                <div className="grid grid-cols-key-bindings gap-x-4 gap-y-1">
                  {bindingsWithName.map(([binding, { name }]) => (
                    <Fragment key={binding}>
                      <KeyBinding binding={binding} />
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
  const pieces = props.binding.split(KEY_BINDING_SEPARATOR);
  return (
    <div className={`grid grid-cols-${pieces.length} gap-x-0.5 w-fit`}>
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
