import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { detectImportFileType } from "@/lib/importer/detect";
import { normalizeImportFile } from "@/lib/importer/normalize";
import type {
  ImportResultSummary,
  NormalizedPostInput,
} from "@/lib/importer/types";

export const dynamic = "force-dynamic";

async function upsertPostsForFile(
  posts: NormalizedPostInput[],
  importBatchId: string,
): Promise<ImportResultSummary> {
  let added = 0;
  let merged = 0;
  const errors: string[] = [];

  for (const post of posts) {
    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.postItem.findUnique({
          where: { igUrl: post.igUrl },
        });

        if (!existing) {
          await (tx.postItem as any).create({
            data: {
              platform: post.platform,
              igUrl: post.igUrl,
              isLiked: post.isLiked,
              isSaved: post.isSaved,
              username: post.username ?? null,
              caption: post.caption ?? null,
              timestamp: post.timestamp ?? null,
              contentType: post.contentType,
            },
          } as any);
          added += 1;
          return;
        }

        // Merge flags
        const isLiked = existing.isLiked || post.isLiked;
        const isSaved = existing.isSaved || post.isSaved;

        // Merge username: keep existing if present
        const username =
          existing.username ?? (post.username ? post.username : null);

        // Merge timestamp
        let timestamp = existing.timestamp;
        if (!timestamp && post.timestamp) {
          timestamp = post.timestamp;
        } else if (timestamp && post.timestamp) {
          if (post.timestamp.getTime() > timestamp.getTime()) {
            timestamp = post.timestamp;
          }
        }

        // Merge contentType: if existing unknown, take new
        const existingContentType = (existing as any).contentType as
          | "video"
          | "post"
          | "unknown"
          | undefined;
        const contentType =
          (existingContentType ?? "unknown") === "unknown" &&
          post.contentType !== "unknown"
            ? post.contentType
            : existingContentType ?? "unknown";

        await (tx.postItem as any).update({
          where: { id: existing.id },
          data: {
            isLiked,
            isSaved,
            username,
            timestamp,
            contentType,
          },
        } as any);
        merged += 1;
      });
    } catch (err: any) {
      errors.push(
        `Failed to upsert ${post.igUrl} from ${post.sourceFile}: ${String(
          err?.message ?? err,
        )}`,
      );
    }
  }

  return { added, merged, errors };
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files");

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const createdBatch = await prisma.importBatch.create({
    data: {
      source: "instagram-json-export",
      status: "processing",
      files: JSON.stringify([]), // was []
      stats: JSON.stringify({}), // was {}
      errorLog: JSON.stringify([]), // was []
    },
  });

  const batchId = createdBatch.id;

  let totalAdded = 0;
  let totalMerged = 0;
  const allErrors: string[] = [];
  const fileMeta: any[] = [];

  for (const entry of files) {
    if (!(entry instanceof File)) {
      allErrors.push("Received non-file form entry in files[]");
      continue;
    }

    const filename = entry.name || "unknown.json";
    fileMeta.push({ filename, size: entry.size });

    let text: string;
    try {
      text = await entry.text();
    } catch (err: any) {
      allErrors.push(`Failed to read file ${filename}: ${String(err)}`);
      continue;
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (err: any) {
      allErrors.push(`Invalid JSON in ${filename}: ${String(err)}`);
      continue;
    }

    const type = detectImportFileType(json);
    if (!type) {
      allErrors.push(
        `Unrecognized JSON structure in ${filename} (missing likes_media_likes or saved_saved_media)`,
      );
      continue;
    }

    const normalized = normalizeImportFile(json, type, filename);
    if (!normalized.length) continue;

    const result = await upsertPostsForFile(normalized, batchId);
    totalAdded += result.added;
    totalMerged += result.merged;
    allErrors.push(...result.errors);
  }

  const finalBatch = await prisma.importBatch.update({
    where: { id: batchId },
    data: {
      status: allErrors.length ? "completed-with-errors" : "completed",
      files: JSON.stringify(fileMeta),
      stats: JSON.stringify({
        added: totalAdded,
        merged: totalMerged,
        errorsCount: allErrors.length,
      }),
      errorLog: JSON.stringify(allErrors), // was allErrors
    },
  });

  return NextResponse.json({
    batchId: finalBatch.id,
    added: totalAdded,
    merged: totalMerged,
    errorsCount: allErrors.length,
  });
}
