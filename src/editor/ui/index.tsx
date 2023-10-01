import { render } from "react-dom";
import { App } from "./app";

const renderApp = async () => {
  if (import.meta.env.DEV) {
    // Ugh, linters sometimes... Not sure why TS can't find the declaration file for preact/debug as a dynamic import,
    // but is totally fine when it's a static import.
    //
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await import("preact/debug");
  }

  const root = document.getElementById("root");
  if (!root) {
    throw new Error("couldn't find #root element");
  }

  render(<App />, root);
};

void renderApp();
