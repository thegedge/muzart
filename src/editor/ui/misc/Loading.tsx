import { PageCallout } from "../layout/PageCallout";

export const Loading = () => {
  return (
    <PageCallout>
      <BouncingDot delayMS={100} />
      <BouncingDot delayMS={200} />
      <BouncingDot delayMS={300} />
    </PageCallout>
  );
};

const BouncingDot = (props: { delayMS: number }) => {
  return (
    <div className="inline-block -translate-y-1/4 animate-bounce" style={{ animationDelay: `${props.delayMS}ms` }}>
      .
    </div>
  );
};
