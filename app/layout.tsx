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
        <div className="px-4 py-5">
          <div className="max-w-5xl mx-auto flex items-center justify-between mb-4">
            <a href="/" className="text-sm font-semibold tracking-tight">
              My IG Liked/Saved Feed
            </a>
            <nav className="flex gap-3 text-sm text-slate-300">
              <a href="/" className="hover:text-sky-300 transition-colors">
                Feed
              </a>
              <a
                href="/import"
                className="hover:text-sky-300 transition-colors"
              >
                Import
              </a>
              <a href="/stats" className="hover:text-sky-300 transition-colors">
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
