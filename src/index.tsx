import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./app";

const root = document.getElementById("root");
if (!root) {
  throw new Error("couldn't find #root element");
}

ReactDOM.unstable_createRoot(root).render(<App />);
