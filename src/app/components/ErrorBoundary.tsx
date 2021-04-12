import * as React from "react";

export default class ErrorBoundary extends React.Component<{}, { error?: Error }> {
  constructor(props: any) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      // TODO if development, show stack trace
      return (
        <div>
          <h1 className="text-red-600 text-4xl">{this.state.error.message}</h1>
          {this.state.error.stack}
        </div>
      );
    }
    return this.props.children;
  }
}
