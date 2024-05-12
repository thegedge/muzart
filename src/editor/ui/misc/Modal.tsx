import { ComponentChildren, type Ref } from "preact";
import { forwardRef } from "preact/compat";

export const Modal = forwardRef((props: { title: string; children?: ComponentChildren }, ref?: Ref<HTMLDivElement>) => {
  return (
    <div ref={ref} className="modal" popover="manual">
      <div className="flex flex-col items-center justify-center rounded bg-gray-200 text-black">
        <div className="w-full rounded-t bg-gray-300 p-2 font-bold">{props.title}</div>
        <div className="p-4">{props.children}</div>
      </div>
    </div>
  );
});
