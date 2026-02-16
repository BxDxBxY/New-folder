"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { InstagramEmbed } from "@/components/InstagramEmbed";

type FeedItem = {
  id: string;
  igUrl: string;
  username: string | null;
  isLiked: boolean;
  isSaved: boolean;
  timestamp: string | null;
  contentType: string;
};

type FeedResponse = {
  items: FeedItem[];
  total: number;
  page: number;
  pageSize: number;
};

type Filter = "all" | "liked" | "saved";
type ContentTypeFilter = "all" | "video" | "post";
type Sort = "newest" | "oldest";

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filter, setFilter] = useState<Filter>("all");
  const [contentType, setContentType] = useState<ContentTypeFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const [lastScrollPosition, setLastScrollPosition] = useState<number>(0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasMore = items.length < total;

  const queryKey = useMemo(
    () => `${filter}|${contentType}|${sort}|${q}`,
    [filter, contentType, sort, q],
  );

  async function fetchFeed(nextPage: number, mode: "replace" | "append") {
    const sp = new URLSearchParams();
    sp.set("page", String(nextPage));
    sp.set("pageSize", String(pageSize));
    sp.set("filter", filter);
    sp.set("contentType", contentType);
    sp.set("sort", sort);
    if (q) sp.set("q", q);

    setLoading(true);
    try {
      const res = await fetch(`/api/feed?${sp.toString()}`);
      const data: FeedResponse = await res.json();
      setItems((prev) => (mode === "append" ? [...prev, ...data.items] : data.items));
      setTotal(data.total);
      setPage(data.page);
      setInitialLoaded(true);

      // After adding new embeds, ask Instagram to process again.
      requestAnimationFrame(() => {
        window.instgrm?.Embeds?.process?.();
      });
    } finally {
      setLoading(false);
    }
  }

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreTriggerRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          void fetchFeed(page + 1, "append");
        }
      },
      { rootMargin: "200px" }
    );

    const trigger = loadMoreTriggerRef.current;
    observer.observe(trigger);
    return () => {
      if (trigger) observer.unobserve(trigger);
      observer.disconnect();
    };
  }, [hasMore, loading, page]);

  // Scroll position memory
  useEffect(() => {
    const savedPosition = sessionStorage.getItem("feedScrollPosition");
    if (savedPosition && scrollContainerRef.current && initialLoaded) {
      const pos = Number.parseInt(savedPosition, 10);
      scrollContainerRef.current.scrollTop = pos;
      sessionStorage.removeItem("feedScrollPosition");
    }
  }, [initialLoaded]);

  // Save scroll position before unload
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setLastScrollPosition(container.scrollTop);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    const handleBeforeUnload = () => {
      sessionStorage.setItem("feedScrollPosition", String(lastScrollPosition));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [lastScrollPosition]);

  useEffect(() => {
    // reset pagination when filters/search change
    setItems([]);
    setTotal(0);
    setPage(1);
    setInitialLoaded(false);
    void fetchFeed(1, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  function formattedDate(ts: string | null) {
    if (!ts) return "Unknown date";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "Unknown date";
    return d.toLocaleString();
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Simplified sticky top bar */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 min-w-0 rounded-xl bg-slate-900/60 border border-slate-700 px-3 sm:px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <div className="flex gap-2 flex-wrap">
              {(["all", "saved", "liked"] as const).map((t) => (
                <button
                  key={t}
                  className={`px-2 sm:px-3 py-1.5 text-xs rounded-lg border transition-colors flex-1 sm:flex-none ${
                    filter === t
                      ? "bg-slate-50 text-slate-950 border-slate-200"
                      : "border-slate-700 text-slate-300 bg-slate-900/40 hover:bg-slate-800"
                  }`}
                  onClick={() => setFilter(t)}
                >
                  {t === "all" ? "All" : t === "saved" ? "Saved" : "Liked"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentTypeFilter)}
                className="flex-1 sm:flex-none rounded-xl bg-slate-900/60 border border-slate-700 px-2 sm:px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All</option>
                <option value="video">Videos</option>
                <option value="post">Posts</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="flex-1 sm:flex-none rounded-xl bg-slate-900/60 border border-slate-700 px-2 sm:px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:from-purple-600 hover:to-pink-600 transition-colors w-full sm:w-auto"
          >
            Instagram
          </a>
        </div>
        {initialLoaded && (
          <div className="text-xs text-slate-400 mt-2 text-center px-2">
            {total} items • {items.length} loaded
          </div>
        )}
      </div>

      {/* Reels-like feed with smooth scrolling */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 snap-y snap-mandatory scroll-smooth overscroll-contain ${
          items.length > 0 ? "overflow-y-auto" : "overflow-hidden"
        }`}
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="space-y-0">
            {items.map((item, index) => (
              <article
                key={item.id}
                className="snap-start min-h-screen flex flex-col border-b border-slate-800 bg-slate-950"
              >
                <div className="flex-1 flex flex-col">
                  <div className="p-3 sm:p-4 pb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.isLiked && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Liked
                        </span>
                      )}
                      {item.isSaved && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                          Saved
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {formattedDate(item.timestamp)}
                      </span>
                    </div>
                    <a
                      href={item.igUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-sky-400 hover:text-sky-300 whitespace-nowrap"
                    >
                      Open →
                    </a>
                  </div>

                  <div className="px-3 sm:px-4 pb-2">
                    <p className="text-sm font-semibold text-slate-100">
                      {item.username ?? "Unknown user"}
                    </p>
                  </div>

                  <div className="flex-1 flex items-center justify-center px-3 sm:px-4 pb-4 min-h-0">
                    <InstagramEmbed
                      igUrl={item.igUrl}
                      contentType={item.contentType}
                      autoplay={index === 0}
                    />
                  </div>
                </div>
              </article>
            ))}

            {!items.length && !loading && (
              <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-sm text-slate-400 border border-dashed border-slate-700 rounded-2xl p-6 text-center max-w-md w-full">
                  No posts yet. Upload your Instagram export JSON on{" "}
                  <a href="/import" className="text-sky-300 hover:text-sky-200">
                    /import
                  </a>
                  .
                </div>
              </div>
            )}

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div
                ref={loadMoreTriggerRef}
                className="h-20 flex items-center justify-center"
              >
                {loading && (
                  <div className="text-xs text-slate-400">Loading more...</div>
                )}
              </div>
            )}

            {!hasMore && initialLoaded && items.length > 0 && (
              <div className="h-20 flex items-center justify-center">
                <p className="text-xs text-slate-500">You're all caught up.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
