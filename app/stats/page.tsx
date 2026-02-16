import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  const [total, liked, saved, lastBatch] = await Promise.all([
    prisma.postItem.count(),
    prisma.postItem.count({ where: { isLiked: true } }),
    prisma.postItem.count({ where: { isSaved: true } }),
    prisma.importBatch.findFirst({
      orderBy: { importedAt: "desc" }
    })
  ]);

  return {
    total,
    liked,
    saved,
    lastImport: lastBatch?.importedAt ?? null
  };
}

export default async function StatsPage() {
  const stats = await getStats();

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-6">
        <h2 className="font-semibold text-base sm:text-lg text-slate-100 mb-3 sm:mb-4">
          Library stats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-slate-400 mb-1">Total unique posts</p>
            <p className="text-2xl sm:text-3xl font-semibold text-slate-50">
              {stats.total}
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-slate-400 mb-1">Liked</p>
            <p className="text-2xl sm:text-3xl font-semibold text-emerald-300">
              {stats.liked}
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
            <p className="text-xs sm:text-sm text-slate-400 mb-1">Saved</p>
            <p className="text-2xl sm:text-3xl font-semibold text-sky-300">
              {stats.saved}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-6 text-sm sm:text-base text-slate-200">
        <p className="text-xs sm:text-sm text-slate-400 mb-2">Last import time</p>
        <p className="mt-1 break-words">
          {stats.lastImport
            ? new Date(stats.lastImport).toLocaleString()
            : "No imports yet"}
        </p>
      </section>
    </div>
  );
}

