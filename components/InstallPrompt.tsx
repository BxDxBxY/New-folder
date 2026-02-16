"use client";

import { useEffect, useMemo, useState } from "react";

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  // iOS Safari
  const iosStandalone = (window.navigator as any).standalone === true;
  // Other browsers
  const displayModeStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches === true;
  return iosStandalone || displayModeStandalone;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const ios = useMemo(isIOS, []);

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return;

    // Don't annoy users forever: show once
    const dismissed = localStorage.getItem("install_prompt_dismissed");
    if (dismissed === "1") return;

    // Open our custom popup on first visit
    setOpen(true);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const close = () => {
    localStorage.setItem("install_prompt_dismissed", "1");
    setOpen(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
      close();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 text-white shadow-xl border border-white/10">
        <div className="flex items-start justify-between p-5">
          <div>
            <h2 className="text-lg font-semibold">Install Saved Posts</h2>
            <p className="mt-1 text-sm text-white/70">
              Save posts without living inside Instagram.
            </p>
          </div>
          <button
            onClick={close}
            className="rounded-lg px-3 py-1 text-white/70 hover:text-white hover:bg-white/10"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-5 space-y-3">
          {deferredPrompt ? (
            <button
              onClick={install}
              className="w-full rounded-xl bg-pink-500 hover:bg-pink-400 px-4 py-2 font-medium"
            >
              Install
            </button>
          ) : ios ? (
            <div className="rounded-xl bg-white/5 p-4 text-sm text-white/80">
              iPhone/iPad: Tap <b>Share</b> → <b>Add to Home Screen</b>.
            </div>
          ) : (
            <div className="rounded-xl bg-white/5 p-4 text-sm text-white/80">
              Install prompt not available yet. Use your browser menu →
              <b> Install app</b> / <b>Add to Home screen</b>.
            </div>
          )}

          <button
            onClick={close}
            className="w-full rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
