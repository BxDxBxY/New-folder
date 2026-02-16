import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/db/prisma";
import { detectImportFileType } from "../lib/importer/detect";
import { normalizeImportFile } from "../lib/importer/normalize";
import type { NormalizedPostInput } from "../lib/importer/types";

async function upsertPostsForFile(
  posts: NormalizedPostInput[],
  importBatchId: string
) {
  for (const post of posts) {
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
    });
  }
}

async function seed() {
  const dataDir = path.resolve(process.cwd(), "data");
  const files = ["sample-likes.json", "sample-saved.json"]
    .map((name) => path.join(dataDir, name))
    .filter((p) => fs.existsSync(p));

  if (!files.length) {
    console.log("No sample files found in data/; skipping seed.");
    return;
  }

  const batch = await prisma.importBatch.create({
    data: {
      source: "seed",
      status: "processing",
      files: JSON.stringify(files.map((f) => ({ filename: path.basename(f) }))),
      stats: JSON.stringify({}),
      errorLog: JSON.stringify([])
    }
  });

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(raw);
    const type = detectImportFileType(json);
    if (!type) {
      // Skip unknown structures in seed
      // eslint-disable-next-line no-continue
      continue;
    }
    const normalized = normalizeImportFile(
      json,
      type,
      path.basename(filePath)
    );
    await upsertPostsForFile(normalized, batch.id);
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: "completed"
    }
  });
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

