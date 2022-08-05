import React from "react";

export function PageCallout(props: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center items-center w-screen min-h-screen text-slate-100 p-48">
      <div className="text-8xl">{props.children}</div>
    </div>
  );
}
