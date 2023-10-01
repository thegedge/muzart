import { useEffect, useState } from "preact/hooks";
import { BaseLocationHook, Router } from "wouter";
import { ApplicationState } from "../utils/ApplicationStateContext";
import { useEditorKeyBindings } from "../utils/useEditorKeyBindings";
import ErrorBoundary from "./ErrorBoundary";
import "./app.css";
import { KeyBindingsOverlay } from "./editor/KeyBindingsOverlay";
import { ScoreDropZone } from "./editor/ScoreDropZone";
import { GithubFork } from "./misc/GithubFork";

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
