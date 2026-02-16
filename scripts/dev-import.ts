import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/db/prisma";
import { detectImportFileType } from "../lib/importer/detect";
import { normalizeImportFile } from "../lib/importer/normalize";
import type { ImportResultSummary, NormalizedPostInput } from "../lib/importer/types";

async function upsertPostsForFile(
  posts: NormalizedPostInput[],
  importBatchId: string
): Promise<ImportResultSummary> {
  let added = 0;
  let merged = 0;
  const errors: string[] = [];

  for (const post of posts) {
    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.postItem.findUnique({
          where: { igUrl: post.igUrl }
        });

        if (!existing) {
          await tx.postItem.create({
            data: {
              platform: post.platform,
              igUrl: post.igUrl,
              isLiked: post.isLiked,
              isSaved: post.isSaved,
              username: post.username ?? null,
              caption: post.caption ?? null,
              timestamp: post.timestamp ?? null,
              contentType: post.contentType
            }
          });
          added += 1;
          return;
        }

        const isLiked = existing.isLiked || post.isLiked;
        const isSaved = existing.isSaved || post.isSaved;
        const username =
          existing.username ?? (post.username ? post.username : null);

        let timestamp = existing.timestamp;
        if (!timestamp && post.timestamp) {
          timestamp = post.timestamp;
        } else if (timestamp && post.timestamp) {
          if (post.timestamp.getTime() > timestamp.getTime()) {
            timestamp = post.timestamp;
          }
        }

        const contentType =
          existing.contentType === "unknown" && post.contentType !== "unknown"
            ? post.contentType
            : existing.contentType;

        await tx.postItem.update({
          where: { id: existing.id },
          data: {
            isLiked,
            isSaved,
            username,
            timestamp,
            contentType
          }
        });
        merged += 1;
      });
    } catch (err: any) {
      errors.push(
        `Failed to upsert ${post.igUrl} from ${post.sourceFile}: ${String(
          err?.message ?? err
        )}`
      );
    }
  }

  return { added, merged, errors };
}

async function main() {
  const argPath = process.argv[2];
  if (!argPath) {
    console.error("Usage: ts-node scripts/dev-import.ts data/your-file.json");
    process.exit(1);
  }

  const absPath = path.resolve(process.cwd(), argPath);
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(absPath, "utf8");
  const json = JSON.parse(fileContent);

  const type = detectImportFileType(json);
  if (!type) {
    console.error(
      "Unrecognized JSON structure (expected likes_media_likes or saved_saved_media)"
    );
    process.exit(1);
  }

  const batch = await prisma.importBatch.create({
    data: {
      source: "dev-script",
      status: "processing",
      files: JSON.stringify([{ filename: path.basename(absPath) }]),
      stats: JSON.stringify({}),
      errorLog: JSON.stringify([])
    }
  });

  const normalized = normalizeImportFile(
    json,
    type,
    path.basename(absPath)
  );
  const result = await upsertPostsForFile(normalized, batch.id);

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: result.errors.length ? "completed-with-errors" : "completed",
      stats: JSON.stringify({
        added: result.added,
        merged: result.merged
      }),
      errorLog: JSON.stringify(result.errors)
    }
  });

  console.log("Import complete");
  console.log("Added:", result.added);
  console.log("Merged:", result.merged);
  console.log("Errors:", result.errors.length);

  await prisma.$disconnect();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

