import { Component, ReactNode } from "react";
import { PageCallout } from "./layout/PageCallout";

export default class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  constructor(props: { children: ReactNode }) {
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
          <div className="w-full">
            <h1 className="text-3xl text-red-600">Error: {this.state.error.message}</h1>
            {this.state.error.stack && (
              <pre className="w-full whitespace-pre-wrap text-xl">
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
