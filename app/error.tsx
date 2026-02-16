"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Application error:", error);
    
    // Optionally log to an error tracking service
    // Example: logErrorToService(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-red-950/40 border border-red-700 rounded-xl p-6 text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-red-100 mb-2">
            Something went wrong!
          </h1>
          <p className="text-sm text-red-200 mb-4">
            {error.message || "An unexpected error occurred"}
          </p>
          {error.digest && (
            <p className="text-xs text-red-300/60 mb-4 font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-medium text-white transition-colors"
            >
              Try again
            </button>
            <a
              href="/"
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium text-slate-100 transition-colors"
            >
              Go home
            </a>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
          <p className="mb-2 font-medium text-slate-300">Error details:</p>
          <pre className="overflow-auto max-h-40 text-[10px] font-mono bg-slate-950/60 p-2 rounded border border-slate-800">
            {error.stack || error.toString()}
          </pre>
        </div>
      </div>
    </div>
  );
}
