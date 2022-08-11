import { ComponentChildren } from "preact";
import * as React from "react";
import { PageCallout } from "./layout/PageCallout";

export default class ErrorBoundary extends React.Component<{ children: ComponentChildren }, { error?: Error }> {
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
          <h1 className="text-red-600 text-3xl">Error: {this.state.error.message}</h1>
          <pre className="text-xl">{this.state.error.stack?.replaceAll("webpack-internal:///./", "")}</pre>
        </PageCallout>
      );
    }
    return this.props.children;
  }
}
