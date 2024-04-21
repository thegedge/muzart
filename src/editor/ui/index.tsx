import { render } from "react-dom";
import { App } from "./app";

const renderApp = async () => {
  if (import.meta.env.DEV) {
    // Ugh, linters sometimes... Not sure why TS can't find the declaration file for preact/debug as a dynamic import,
    // but is totally fine when it's a static import.
    //
    // @ts-expect-error -- TS can't find the declaration file for preact/debug as a dynamic import, and I don't care
    await import("preact/debug");
  }

  const root = document.getElementById("root");
  if (!root) {
    throw new Error("couldn't find #root element");
  }

  render(<App />, root);
};

void renderApp();
