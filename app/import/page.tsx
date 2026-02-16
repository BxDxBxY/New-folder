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
    <div className="space-y-4">
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3 text-sm text-slate-200">
        <h2 className="font-semibold text-base">Import Instagram JSON</h2>
        <p>
          Upload your Instagram &quot;Download Your Information&quot; JSON files
          for <strong>liked</strong> and <strong>saved</strong> posts. This app
          only reads local files you choose.
        </p>
        <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
          <li>
            Liked posts: files containing a top-level{" "}
            <code className="px-1 py-0.5 rounded bg-slate-800 text-[11px]">
              likes_media_likes
            </code>{" "}
            array.
          </li>
          <li>
            Saved posts: files containing a top-level{" "}
            <code className="px-1 py-0.5 rounded bg-slate-800 text-[11px]">
              saved_saved_media
            </code>{" "}
            array.
          </li>
        </ul>
      </section>

      <form onSubmit={onSubmit} className="space-y-3">
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
          className={`border-2 border-dashed rounded-xl p-6 text-center text-sm cursor-pointer ${
            isDragging
              ? "border-sky-400 bg-slate-900"
              : "border-slate-700 bg-slate-950/60"
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
            <p className="font-medium text-slate-100">
              Drag &amp; drop JSON files here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              …or click to browse your Instagram export folder.
            </p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 space-y-1 max-h-48 overflow-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">
                Selected files ({files.length})
              </span>
              <button
                type="button"
                className="text-[11px] text-sky-300 hover:text-sky-200"
                onClick={() => setFiles([])}
              >
                Clear
              </button>
            </div>
            <ul className="space-y-0.5">
              {files.map((f, i) => (
                <li key={i} className="truncate text-slate-300">
                  {f.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !files.length}
          className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-sm font-medium text-slate-950"
        >
          {submitting ? "Importing…" : "Run Import"}
        </button>
      </form>

      {result && (
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 space-y-1">
          <h3 className="font-semibold text-base">Import complete</h3>
          <p className="text-xs text-slate-400 break-all">
            Batch ID:{" "}
            <code className="px-1 py-0.5 rounded bg-slate-950 text-[11px]">
              {result.batchId}
            </code>
          </p>
          <p>
            Added: <span className="font-semibold">{result.added}</span> •
            Merged: <span className="font-semibold">{result.merged}</span> •
            Errors:{" "}
            <span className="font-semibold">{result.errorsCount}</span>
          </p>
          <p className="text-xs text-slate-400">
            You can now view your feed on the{" "}
            <a href="/" className="text-sky-300 hover:text-sky-200">
              Feed
            </a>{" "}
            page.
          </p>
        </section>
      )}

      {error && (
        <section className="bg-red-950/40 border border-red-700 rounded-xl p-3 text-xs text-red-100">
          <p className="font-semibold mb-1">Import failed</p>
          <p>{error}</p>
        </section>
      )}
    </div>
  );
}

