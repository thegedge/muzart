import { createRoot } from "react-dom/client";
import { App } from "./app";

const renderApp = async () => {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("couldn't find #root element");
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- typescript-eslint false positive
  const reactRoot = createRoot(root);
  reactRoot.render(<App />);
};

void renderApp();
