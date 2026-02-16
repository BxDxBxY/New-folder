import {
  ContentType,
  ImportFileType,
  NormalizedPostInput,
  RawLikesFile,
  RawSavedFile
} from "./types";
import { parseLikesFile } from "./parsers/likes";
import { parseSavedFile } from "./parsers/saved";

export function inferContentTypeFromUrl(igUrl: string): ContentType {
  const url = igUrl.toLowerCase();
  if (url.includes("/reel/") || url.includes("/tv/")) return "video";
  if (url.includes("/p/")) return "post";
  return "unknown";
}

export function normalizeImportFile(
  json: unknown,
  type: ImportFileType,
  sourceFile: string
): NormalizedPostInput[] {
  if (type === "likes") {
    return parseLikesFile(json as RawLikesFile, sourceFile);
  }

  if (type === "saved") {
    return parseSavedFile(json as RawSavedFile, sourceFile);
  }

  return [];
}

