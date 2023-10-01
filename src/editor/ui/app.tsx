import { useEffect, useState } from "preact/hooks";
import { BaseLocationHook, Router } from "wouter";
import { ApplicationState } from "../utils/ApplicationStateContext";
import { useEditorKeyBindings } from "../utils/useEditorKeyBindings";
import ErrorBoundary from "./ErrorBoundary";
import "./app.css";
import { KeyBindingsOverlay } from "./editor/KeyBindingsOverlay";
import { ScoreDropZone } from "./editor/ScoreDropZone";

export const App = () => {
  return (
    <div className="bg-gray-400 min-h-screen min-w-max">
      <GithubFork />
      <Router hook={useHashLocation}>
        <ErrorBoundary>
          <ApplicationState>
            <KeyBindings />
            <ScoreDropZone />
          </ApplicationState>
        </ErrorBoundary>
      </Router>
    </div>
  );
};

const KeyBindings = () => {
  const bindings = useEditorKeyBindings();
  return <KeyBindingsOverlay bindings={bindings} />;
};

const GithubFork = () => {
  if (import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="github-fork">
      <a href="https://github.com/thegedge/muzart" className="underline">
        <svg viewBox="0 0 17 17" version="1.1" width="48" height="48">
          <path
            fillRule="evenodd"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
          ></path>
        </svg>
      </a>
    </div>
  );
};

const currentLocation = () => {
  return window.location.hash.replace(/^#/, "") || "/";
};

const navigate = (to: string) => {
  window.location.hash = to;
};

const useHashLocation: BaseLocationHook = () => {
  const [location, setLocation] = useState(currentLocation());

  useEffect(() => {
    const handler = () => setLocation(currentLocation());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return [location, navigate];
};
