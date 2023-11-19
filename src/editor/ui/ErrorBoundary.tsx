import { Component, ComponentChildren } from "preact";
import { PageCallout } from "./layout/PageCallout";

export default class ErrorBoundary extends Component<{ children: ComponentChildren }, { error?: Error }> {
  constructor(props: { children: ComponentChildren }) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <PageCallout>
          <div>
            <h1 className="text-red-600 text-3xl">Error: {this.state.error.message}</h1>
            {this.state.error.stack && (
              <pre className="w-full text-xl whitespace-pre-wrap">
                {this.state.error.stack
                  .split("\n")
                  .filter((line) => !line.includes("/chunk-"))
                  .map((line) => line.replace("@", " @ "))
                  .map((line) => line.replaceAll(/https:\/\/muzart\.dev\/|.vite\/deps\/|\?.*/g, ""))
                  .join("\n")}
              </pre>
            )}
          </div>
        </PageCallout>
      );
    }
    return this.props.children;
  }
}
