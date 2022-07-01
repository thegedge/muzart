import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./muzart/app";

const root = document.getElementById("root");
if (!root) {
  throw new Error("couldn't find #root element");
}

ReactDOM.createRoot(root).render(<App />);
