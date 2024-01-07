import clsx from "clsx";
import { HTMLAttributes } from "preact/compat";

export const Menu = (props: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div {...props} className={clsx(props.className, "min-w-48 rounded bg-gray-950 p-1 text-gray-300 outline-none")} />
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
