/* eslint-disable @typescript-eslint/no-unnecessary-condition -- bindings[binding] could be undefined, but I don't want to type it that way right now*/
import { useEffect } from "preact/hooks";
import { IS_MAC } from "../../utils/platform";

export interface KeyBindingContext<T = never> {
  previous?: {
    sequence: string;
    when: number;
    other: T;
  };
}

export type KeyBinding<T = never> = {
  name: string;
  group?: string;
  when?: string;
  key: string;
  action: (context: KeyBindingContext<T>) => T;
};

export const KEY_BINDING_SEPARATOR = " + ";

export type KeyBindings<T = never> = KeyBinding<T>[];

const bindingKeyOrderValue = (v: string) => {
  switch (v) {
    case "$mod":
      return "$1";
    case "Shift":
      return "$2";
    case "Alt":
      return "$3";
    default:
      return v;
  }
};

export const bindingKeyCompare = (a: string, b: string) => {
  const aCompare = bindingKeyOrderValue(a);
  const bCompare = bindingKeyOrderValue(b);
  if (aCompare < bCompare) {
    return -1;
  } else if (aCompare > bCompare) {
    return 1;
  } else {
    return 0;
  }
};

/**
 * Install a keydown listener to handle the supplied key bindings.
 *
 * @param keybindingGroups The key bindings to install.
 * @param state The state to use for evaluating `when` clauses.
 */
export const useKeyBindings = <StateT, ContextOtherT = never>(
  keyBindings: KeyBindings<ContextOtherT>,
  state: StateT,
): void => {
  useEffect(() => {
    const bindingGroups = keyBindings.reduce<Record<string, KeyBinding<ContextOtherT>[]>>((bindings, binding) => {
      bindings[binding.key] ??= [];
      bindings[binding.key].push(binding);
      return bindings;
    }, {});

    let context: KeyBindingContext<ContextOtherT> = {};

    const listener = (event: KeyboardEvent) => {
      const pieces = [];

      // These are pushed in the order we sort by when compuring the binding groups above
      if ((IS_MAC && event.metaKey) || (!IS_MAC && event.ctrlKey)) {
        pieces.push("$mod");
      }

      if (event.shiftKey) {
        pieces.push("Shift");
      }

      if (event.altKey) {
        pieces.push("Alt");
      }

      pieces.push(event.key);
      const sequence = pieces.join(KEY_BINDING_SEPARATOR);
      const bindings = bindingGroups[sequence];
      if (!bindings) {
        return;
      }

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

      const binding = applicableBindings[0];
      if (binding) {
        event.stopPropagation();
        event.preventDefault();

        const other = binding.action(context);

        context = {
          previous: {
            sequence,
            when: Date.now(),
            other,
          },
        };
      }
    };

    document.body.addEventListener("keydown", listener);
    return () => {
      document.body.removeEventListener("keydown", listener);
    };
  }, [keyBindings, state]);
};
