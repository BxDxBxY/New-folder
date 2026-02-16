import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const filter = searchParams.get("filter") ?? "all";
  const contentType = searchParams.get("contentType") ?? "all";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "10");

  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (filter === "liked") {
    where.isLiked = true;
  } else if (filter === "saved") {
    where.isSaved = true;
  }

  if (contentType === "video") {
    where.contentType = "video";
  } else if (contentType === "post") {
    where.contentType = "post";
  }

  if (q) {
    // SQLite doesn't support case-insensitive mode, so we use contains
    // and handle case-insensitivity in the query by lowercasing
    const searchLower = q.toLowerCase();
    where.OR = [
      { username: { contains: q } },
      { caption: { contains: q } },
      { igUrl: { contains: q } }
    ];
  }

  const orderBy =
    sort === "oldest"
      ? [{ timestamp: "asc" as const }, { createdAt: "asc" as const }]
      : [{ timestamp: "desc" as const }, { createdAt: "desc" as const }];

  const [total, items] = await Promise.all([
    prisma.postItem.count({ where }),
    prisma.postItem.findMany({
      where,
      orderBy,
      skip,
      take: pageSize
    })
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize
  });
}

