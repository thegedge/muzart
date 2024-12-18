import { Suspense, useEffect, useState } from "react";
import { BaseLocationHook, Router } from "wouter";
import { ApplicationState } from "../utils/ApplicationStateContext";
import { useEditorKeyBindings } from "../utils/useEditorKeyBindings";
import ErrorBoundary from "./ErrorBoundary";
import "./app.css";
import { EditorRouter } from "./editor/EditorRouter";
import { KeyBindingsOverlay } from "./editor/KeyBindingsOverlay";
import { GithubFork } from "./misc/GithubFork";
import { Loading } from "./misc/Loading";

export const App = () => {
  return (
    <div className="min-h-screen min-w-max bg-gray-400">
      <GithubFork />
      <Router hook={useHashLocation}>
        <ErrorBoundary>
          <ApplicationState>
            <KeyBindings />
            <Suspense fallback={<Loading />}>
              <EditorRouter />
            </Suspense>
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
