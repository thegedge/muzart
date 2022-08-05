import React from "react";
import { PageCallout } from "../layout/PageCallout";

export function Loading() {
  return (
    <PageCallout>
      Loading
      <BouncingDot delayMS={100} />
      <BouncingDot delayMS={200} />
      <BouncingDot delayMS={300} />
    </PageCallout>
  );
}

function BouncingDot(props: { delayMS: number }) {
  return (
    <div className="animate-bounce -translate-y-1/4 inline-block" style={{ animationDelay: `${props.delayMS}ms` }}>
      .
    </div>
  );
}
