import { NormalizedPostInput, RawLikesFile } from "../types";
import { inferContentTypeFromUrl } from "../normalize";

function isValidInstagramUrl(href?: string): href is string {
  return typeof href === "string" && href.includes("instagram.com/");
}

export function parseLikesFile(
  data: RawLikesFile,
  sourceFile: string
): NormalizedPostInput[] {
  if (!Array.isArray(data.likes_media_likes)) return [];

  const result: NormalizedPostInput[] = [];

  for (const item of data.likes_media_likes) {
    const username = item.title ?? null;
    const first = item.string_list_data?.[0];
    if (!first) continue;

    const href = first.href;
    if (!isValidInstagramUrl(href)) continue;

    const ts = typeof first.timestamp === "number" ? first.timestamp : null;
    const timestamp = ts ? new Date(ts * 1000) : null;

    result.push({
      platform: "instagram",
      igUrl: href,
      isLiked: true,
      isSaved: false,
      username,
      caption: null,
      timestamp,
      contentType: inferContentTypeFromUrl(href),
      sourceFile,
      rawType: "likes"
    });
  }

  return result;
}

