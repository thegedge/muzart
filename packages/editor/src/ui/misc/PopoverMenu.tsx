import clsx from "clsx";
import { HTMLAttributes, useState, type MouseEventHandler, type ReactElement } from "react";
import { Menu } from "./Menu";

export const PopoverMenu = (
  props: HTMLAttributes<HTMLDivElement> & {
    onHideMenu: () => void;
    children?: ReactElement<typeof Menu>;
    offsetX?: number;
    offsetY?: number;
  },
) => {
  const [left, setLeft] = useState(-1);
  const [top, setTop] = useState(-1);

  const hideMenu: MouseEventHandler = (event) => {
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
