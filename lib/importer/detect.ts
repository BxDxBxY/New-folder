import type { ImportFileType } from "./types";

export function detectImportFileType(json: unknown): ImportFileType | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;

  if (Array.isArray((obj as any).likes_media_likes)) {
    return "likes";
  }

  if (Array.isArray((obj as any).saved_saved_media)) {
    return "saved";
  }

  return null;
}

