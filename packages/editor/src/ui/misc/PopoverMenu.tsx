import clsx from "clsx";
import { JSX, VNode } from "preact";
import { HTMLAttributes } from "preact/compat";
import { useState } from "preact/hooks";
import { Menu } from "./Menu";

// TODO VNode<typeof Menu> isn't typechecking properly (allows any element)
export const PopoverMenu = (
  props: HTMLAttributes<HTMLDivElement> & {
    onHideMenu: () => void;
    children?: VNode<typeof Menu>;
    offsetX?: number;
    offsetY?: number;
  },
) => {
  const [left, setLeft] = useState(-1);
  const [top, setTop] = useState(-1);

  const hideMenu: JSX.MouseEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    props.onHideMenu();
  };

  return (
    <div
      {...props}
      className={clsx(
        left == -1 || top == -1 ? "invisible" : "visible",
        "z-top absolute bottom-0 left-0 right-0 top-0",
        props.className,
      )}
      onMouseDown={hideMenu}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        ref={(element) => {
          if (!element) {
            return;
          }

          const x = props.offsetX ?? 0;
          const y = props.offsetY ?? 0;
          const rect = element.getBoundingClientRect();
          if (x + rect.width > window.innerWidth) {
            setLeft(x - rect.width);
          } else {
            setLeft(x);
          }

          if (y + rect.height > window.innerHeight) {
            setTop(y - rect.height);
          } else {
            setTop(y);
          }
        }}
        className="relative w-fit"
        style={{ left, top }}
      >
        {props.children}
      </div>
    </div>
  );
};
