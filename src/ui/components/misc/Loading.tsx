import { PageCallout } from "../layout/PageCallout";

export const Loading = () => {
  return (
    <PageCallout>
      Loading
      <BouncingDot delayMS={100} />
      <BouncingDot delayMS={200} />
      <BouncingDot delayMS={300} />
    </PageCallout>
  );
};

const BouncingDot = (props: { delayMS: number }) => {
  return (
    <div className="animate-bounce -translate-y-1/4 inline-block" style={{ animationDelay: `${props.delayMS}ms` }}>
      .
    </div>
  );
};
