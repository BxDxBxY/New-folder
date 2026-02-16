import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "My Instagram Liked/Saved Feed",
  description: "Personal viewer for liked and saved Instagram posts",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-5">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <a href="/" className="text-sm sm:text-base font-semibold tracking-tight whitespace-nowrap">
              My IG Liked/Saved Feed
            </a>
            <nav className="flex gap-2 sm:gap-3 text-xs sm:text-sm text-slate-300 flex-wrap">
              <a href="/" className="hover:text-sky-300 transition-colors px-2 py-1 rounded hover:bg-slate-800">
                Feed
              </a>
              <a
                href="/import"
                className="hover:text-sky-300 transition-colors px-2 py-1 rounded hover:bg-slate-800"
              >
                Import
              </a>
              <a href="/stats" className="hover:text-sky-300 transition-colors px-2 py-1 rounded hover:bg-slate-800">
                Stats
              </a>
            </nav>
          </div>
          <main className="max-w-5xl mx-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
