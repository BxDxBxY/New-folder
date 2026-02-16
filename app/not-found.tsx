import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">404</h1>
          <h2 className="text-lg font-semibold text-slate-200 mb-3">
            Page Not Found
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-sm font-medium text-white transition-colors"
            >
              Go to Feed
            </Link>
            <Link
              href="/import"
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium text-slate-100 transition-colors"
            >
              Import Data
            </Link>
            <Link
              href="/stats"
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium text-slate-100 transition-colors"
            >
              View Stats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
