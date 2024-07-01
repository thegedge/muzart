import { ComponentChildren } from "preact";

export const PageCallout = (props: { children: ComponentChildren }) => {
  return (
    <div className="flex min-h-screen w-screen items-center justify-center px-12 py-24 text-8xl text-slate-100">
      {props.children}
    </div>
  );
};
