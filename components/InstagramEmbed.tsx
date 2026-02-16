"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process?: () => void;
      };
    };
  }
}

let embedScriptPromise: Promise<void> | null = null;

function loadInstagramEmbedScriptOnce(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (embedScriptPromise) return embedScriptPromise;

  embedScriptPromise = new Promise<void>((resolve, reject) => {
    // If the script already exists (e.g. HMR), reuse it.
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-instagram-embed="true"]',
    );
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = "https://www.instagram.com/embed.js";
    script.setAttribute("data-instagram-embed", "true");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Instagram embed.js"));
    document.body.appendChild(script);
  });

  return embedScriptPromise;
}

export function InstagramEmbed({
  igUrl,
  className,
  contentType = "unknown",
  autoplay = false,
}: {
  igUrl: string;
  className?: string;
  contentType?: string;
  autoplay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [didEmbed, setDidEmbed] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isInView, setIsInView] = useState(false);

  const permalink = useMemo(() => {
    return igUrl;
  }, [igUrl]);

  // IntersectionObserver for autoplay
  useEffect(() => {
    if (contentType !== "video") return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(entry?.isIntersecting ?? false);

        if (entry?.isIntersecting && contentType === "video") {
          // Try to play video when in view
          const iframe = container.querySelector("iframe");
          if (iframe && iframe.contentWindow) {
            try {
              iframe.contentWindow.postMessage(
                JSON.stringify({ type: "play" }),
                "*"
              );
            } catch (e) {
              // Ignore cross-origin errors
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [contentType]);

  // Handle click to pause/play
  useEffect(() => {
    const container = containerRef.current;
    if (!container || contentType !== "video") return;

    const handleClick = () => {
      setIsPlaying((prev) => {
        const iframe = container.querySelector("iframe");
        if (iframe && iframe.contentWindow) {
          try {
            iframe.contentWindow.postMessage(
              JSON.stringify({ type: prev ? "pause" : "play" }),
              "*"
            );
          } catch (e) {
            // Ignore cross-origin errors
          }
        }
        return !prev;
      });
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [contentType]);

  useEffect(() => {
    let cancelled = false;
    setDidEmbed(null);

    async function run() {
      try {
        await loadInstagramEmbedScriptOnce();
      } catch {
        if (!cancelled) setDidEmbed(false);
        return;
      }

      requestAnimationFrame(() => {
        window.instgrm?.Embeds?.process?.();

        setTimeout(() => {
          if (cancelled) return;
          const el = containerRef.current;
          const hasIframe = !!el?.querySelector("iframe");
          setDidEmbed(hasIframe);

          // Set up iframe reference for video control
          if (hasIframe && contentType === "video" && el) {
            const iframe = el.querySelector("iframe");
            if (iframe) {
              iframeRef.current = iframe as HTMLIFrameElement;
              // Try to enable autoplay and loop
              try {
                iframe.setAttribute("allow", "autoplay; encrypted-media");
              } catch (e) {
                // Ignore
              }
            }
          }
        }, 1000);
      });
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [permalink, contentType]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className ?? ""} ${
        contentType === "video" ? "cursor-pointer" : ""
      }`}
    >
      {didEmbed === false && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-sm text-slate-200 mb-2">Preview unavailable</p>
          <p className="text-xs text-slate-400 break-all text-center mb-4 max-w-md">
            {igUrl}
          </p>
          <a
            href={igUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            Open in Instagram
          </a>
        </div>
      )}

      <blockquote
        className="instagram-media"
        data-instgrm-permalink={permalink}
        data-instgrm-version="14"
        data-instgrm-captioned={contentType === "video" ? "true" : undefined}
        style={{
          background: "transparent",
          border: 0,
          margin: 0,
          padding: 0,
          width: "100%",
          maxWidth: "100%",
        }}
      />

      {contentType === "video" && isInView && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/30 rounded-full p-3">
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

