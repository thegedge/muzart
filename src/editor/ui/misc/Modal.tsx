import { ComponentChildren } from "preact";

export const Modal = (props: { title: string; children?: ComponentChildren }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 top-0 z-top flex items-center justify-center p-16 backdrop-blur-sm backdrop-brightness-50">
      <div className="flex flex-col items-center justify-center rounded bg-gray-200 text-black shadow-modal">
        <div className="w-full rounded-t bg-gray-300 p-2 font-bold">{props.title}</div>
        <div className="p-4">{props.children}</div>
      </div>
    </div>
  );
};
