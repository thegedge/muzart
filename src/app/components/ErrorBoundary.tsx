import * as React from "react";
import { PageCallout } from "./layout/PageCallout";

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error?: Error }> {
  constructor(props: any) {
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
          <h1 className="text-red-600 text-4xl">Error: {this.state.error.message}</h1>
          {this.state.error.stack}
        </PageCallout>
      );
    }
    return this.props.children;
  }
}
