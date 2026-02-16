import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [total, liked, saved, lastBatch] = await Promise.all([
    prisma.postItem.count(),
    prisma.postItem.count({ where: { isLiked: true } }),
    prisma.postItem.count({ where: { isSaved: true } }),
    prisma.importBatch.findFirst({
      orderBy: { importedAt: "desc" }
    })
  ]);

  return NextResponse.json({
    totalPosts: total,
    likedCount: liked,
    savedCount: saved,
    lastImportTime: lastBatch?.importedAt ?? null
  });
}

