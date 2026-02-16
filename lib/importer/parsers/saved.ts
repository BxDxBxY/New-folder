import { NormalizedPostInput, RawSavedFile } from "../types";
import { inferContentTypeFromUrl } from "../normalize";

function isValidInstagramUrl(href?: string): href is string {
  return typeof href === "string" && href.includes("instagram.com/");
}

export function parseSavedFile(
  data: RawSavedFile,
  sourceFile: string
): NormalizedPostInput[] {
  if (!Array.isArray(data.saved_saved_media)) return [];

  const result: NormalizedPostInput[] = [];

  for (const item of data.saved_saved_media) {
    const username = item.title ?? null;
    const entry = item.string_map_data?.["Saved on"];
    if (!entry) continue;

    const href = entry.href;
    if (!isValidInstagramUrl(href)) continue;

    const ts = typeof entry.timestamp === "number" ? entry.timestamp : null;
    const timestamp = ts ? new Date(ts * 1000) : null;

    result.push({
      platform: "instagram",
      igUrl: href,
      isLiked: false,
      isSaved: true,
      username,
      caption: null,
      timestamp,
      contentType: inferContentTypeFromUrl(href),
      sourceFile,
      rawType: "saved"
    });
  }

  return result;
}

