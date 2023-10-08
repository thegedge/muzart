import { useEffect } from "preact/hooks";
import { IS_MAC } from "../../utils/platform";

export interface KeyBinding {
  name?: string;
  when?: string;
  action: () => void;
}

export const KEY_BINDING_SEPARATOR = " + ";

export type KeyBindingGroups = Record<string, Record<string, KeyBinding>>;

/**
 * Install a keydown listener to handle the supplied key bindings.
 *
 * @param keybindingGroups The key bindings to install.
 * @param state The state to use for evaluating `when` clauses.
 */
export const useKeyBindings = <StateT>(keybindingGroups: KeyBindingGroups, state: StateT): void => {
  useEffect(() => {
    const bindingGroups = Object.values(keybindingGroups)
      .flatMap((group) => Object.entries(group))
      .reduce(
        (bindings, [key, binding]) => {
          bindings[key] ??= [];
          bindings[key].push(binding);
          return bindings;
        },
        {} as Record<string, KeyBinding[]>,
      );

    const listener = (event: KeyboardEvent) => {
      const pieces = [];
      if (event.shiftKey) {
        pieces.push("Shift");
      }

      if (event.altKey) {
        pieces.push("Alt");
      }

      if ((IS_MAC && event.metaKey) || (!IS_MAC && event.ctrlKey)) {
        pieces.push("$mod");
      }

      pieces.push(event.key);
      const sequence = pieces.join(KEY_BINDING_SEPARATOR);
      const bindings = bindingGroups[sequence];
      if (bindings) {
        const applicableBindings = bindings.filter((binding) => {
          if (!binding.when) {
            return true;
          }

          // TODO support parentheses and ||
          const pieces = binding.when.split(" && ");
          return pieces.every((piece) => {
            return piece[0] == "!" ? !state[piece.substring(1) as keyof StateT] : state[piece as keyof StateT];
          });
        });

        if (applicableBindings.length > 1) {
          console.warn("Multiple bindings found for sequence", sequence, applicableBindings);
          return;
        }

        if (applicableBindings.length == 1) {
          event.stopPropagation();
          event.preventDefault();
          applicableBindings[0].action();
        }
      }
    };

    document.body.addEventListener("keydown", listener);
    return () => {
      document.body.removeEventListener("keydown", listener);
    };
  }, [keybindingGroups, state]);
};
