export type ImportFileType = "likes" | "saved";
export type ContentType = "video" | "post" | "unknown";

export interface RawLikesFile {
  likes_media_likes: Array<{
    title: string;
    string_list_data?: Array<{
      href?: string;
      value?: string;
      timestamp?: number;
    }>;
  }>;
}

export interface RawSavedFile {
  saved_saved_media: Array<{
    title: string;
    string_map_data?: {
      ["Saved on"]?: {
        href?: string;
        timestamp?: number;
      };
      [key: string]: {
        href?: string;
        timestamp?: number;
      } | undefined;
    };
  }>;
}

export interface NormalizedPostInput {
  platform: "instagram";
  igUrl: string;
  isLiked: boolean;
  isSaved: boolean;
  username?: string | null;
  caption?: string | null;
  timestamp?: Date | null;
  contentType: ContentType;
  sourceFile: string;
  rawType: ImportFileType;
}

export interface ImportResultSummary {
  added: number;
  merged: number;
  errors: string[];
}

