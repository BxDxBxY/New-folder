"use client";

import { useState, DragEvent, ChangeEvent, FormEvent } from "react";

type ImportResponse = {
  batchId: string;
  added: number;
  merged: number;
  errorsCount: number;
};

export default function ImportPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.name.toLowerCase().endsWith(".json")
    );
    if (dropped.length) {
      setFiles((prev) => [...prev, ...dropped]);
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).filter((f) =>
      f.name.toLowerCase().endsWith(".json")
    );
    if (selected.length) {
      setFiles((prev) => [...prev, ...selected]);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!files.length) return;

    setSubmitting(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    for (const f of files) {
      formData.append("files", f);
    }

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Import failed");
      }
      const data: ImportResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4 text-sm sm:text-base text-slate-200">
        <h2 className="font-semibold text-base sm:text-lg">Import Instagram JSON</h2>
        <p className="leading-relaxed">
          Upload your Instagram &quot;Download Your Information&quot; JSON files
          for <strong>liked</strong> and <strong>saved</strong> posts. This app
          only reads local files you choose.
        </p>
        <ul className="list-disc list-inside text-slate-300 text-xs sm:text-sm space-y-1.5 sm:space-y-2 pl-2">
          <li>
            Liked posts: files containing a top-level{" "}
            <code className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] sm:text-[11px] font-mono">
              likes_media_likes
            </code>{" "}
            array.
          </li>
          <li>
            Saved posts: files containing a top-level{" "}
            <code className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] sm:text-[11px] font-mono">
              saved_saved_media
            </code>{" "}
            array.
          </li>
        </ul>
      </section>

      <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 md:p-10 text-center text-sm sm:text-base cursor-pointer transition-colors ${
            isDragging
              ? "border-sky-400 bg-slate-900"
              : "border-slate-700 bg-slate-950/60 hover:border-slate-600"
          }`}
        >
          <input
            type="file"
            multiple
            accept=".json,application/json"
            onChange={onFileChange}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="block cursor-pointer">
            <p className="font-medium text-slate-100 mb-1 sm:mb-2">
              Drag &amp; drop JSON files here
            </p>
            <p className="text-xs sm:text-sm text-slate-400">
              …or click to browse your Instagram export folder.
            </p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-slate-200 space-y-1 max-h-48 sm:max-h-64 overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                Selected files ({files.length})
              </span>
              <button
                type="button"
                className="text-[11px] sm:text-xs text-sky-300 hover:text-sky-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                onClick={() => setFiles([])}
              >
                Clear
              </button>
            </div>
            <ul className="space-y-1">
              {files.map((f, i) => (
                <li key={i} className="truncate text-slate-300 break-all">
                  {f.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !files.length}
          className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base font-medium text-slate-950 transition-colors"
        >
          {submitting ? "Importing…" : "Run Import"}
        </button>
      </form>

      {result && (
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-6 text-sm sm:text-base text-slate-200 space-y-2 sm:space-y-3">
          <h3 className="font-semibold text-base sm:text-lg">Import complete</h3>
          <p className="text-xs sm:text-sm text-slate-400 break-all">
            Batch ID:{" "}
            <code className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] sm:text-[11px] font-mono">
              {result.batchId}
            </code>
          </p>
          <p className="flex flex-wrap gap-2">
            <span>Added: <span className="font-semibold">{result.added}</span></span>
            <span>•</span>
            <span>Merged: <span className="font-semibold">{result.merged}</span></span>
            <span>•</span>
            <span>Errors: <span className="font-semibold">{result.errorsCount}</span></span>
          </p>
          <p className="text-xs sm:text-sm text-slate-400">
            You can now view your feed on the{" "}
            <a href="/" className="text-sky-300 hover:text-sky-200 underline">
              Feed
            </a>{" "}
            page.
          </p>
        </section>
      )}

      {error && (
        <section className="bg-red-950/40 border border-red-700 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-red-100">
          <p className="font-semibold mb-1 sm:mb-2">Import failed</p>
          <p className="break-words">{error}</p>
        </section>
      )}
    </div>
  );
}

