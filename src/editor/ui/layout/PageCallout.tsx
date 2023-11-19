import { ComponentChildren } from "preact";

export const PageCallout = (props: { children: ComponentChildren }) => {
  return (
    <div className="flex justify-stretch items-center w-screen min-h-screen text-slate-100 px-12 py-24 text-8xl">
      {props.children}
    </div>
  );
};
