import { Suspense } from "preact/compat";
import ErrorBoundary from "./ErrorBoundary";
import "./app.css";

export const App = () => {
  return (
    <div className="min-h-screen min-w-max bg-gray-400">
      <ErrorBoundary>
        <Suspense fallback="Loading...">
          <div>test</div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};
