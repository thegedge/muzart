import clsx from "clsx";
import { VNode, isValidElement } from "preact";
import { Children, HTMLAttributes } from "preact/compat";
import { MaybeArray } from "../../../utils/types";
import { Command } from "../../state/Application";
import { useApplicationState } from "../../utils/ApplicationStateContext";

export type MenuProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: MaybeArray<VNode | Command>;
};

export const Menu = (props: MenuProps) => {
  const application = useApplicationState();

  return (
    <div {...props} className={clsx(props.className, "min-w-48 rounded bg-gray-950 p-1 text-gray-300 outline-none")}>
      {Children.map(props.children, (child) => {
        if (isValidElement(child)) {
          return child;
        }

        const action = child.actionForContextMenu?.bind(child);
        if (!action) {
          return null;
        }

        return (
          <MenuItem
            key={child.name}
            onMouseDown={() => {
              application.dispatch(action(application));
              application.state.hideContextMenu();
            }}
          >
            {child.name}
          </MenuItem>
        );
      })}
    </div>
  );
};

export const MenuItem = (props: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      onMouseDown={(event) => {
        event.stopPropagation();
        props.onMouseDown?.(event);
      }}
      className={clsx(
        props.className,
        "flex w-full cursor-pointer gap-2 rounded bg-gray-950 py-1 pl-6 shadow-black text-shadow-sm hover:bg-blue-700",
      )}
    />
  );
};
