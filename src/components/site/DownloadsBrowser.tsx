"use client";

import { useMemo, useState } from "react";
import { Download, Eye, FileText, Search, X } from "lucide-react";

export type DownloadItem = {
  id: number;
  category: string;
  categoryLabel: string;
  title: string;
  /** Both languages, lower-cased, so search works whichever script is typed. */
  haystack: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  year: number | null;
  date: string;
};

type Labels = {
  searchPlaceholder: string;
  empty: string;
  documents: string;
  download: string;
  view: string;
  clear: string;
};

/** Instant, client-side search and category filter over the document repository. */
export function DownloadsBrowser({
  items,
  tabs,
  initialCategory,
  labels,
}: {
  items: DownloadItem[];
  tabs: { key: string; label: string }[];
  initialCategory: string;
  labels: Labels;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: items.length };
    for (const item of items) map[item.category] = (map[item.category] ?? 0) + 1;
    return map;
  }, [items]);

  const visible = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter(
      (item) => (category === "ALL" || item.category === category) && words.every((w) => item.haystack.includes(w)),
    );
  }, [items, category, query]);

  return (
    <div className="grid gap-5">
      <div className="card grid gap-3 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-5 -translate-y-1/2 text-teal" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
            dir="auto"
            className="input py-3 ps-11 pe-10 text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={labels.clear}
              className="absolute end-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-navy/50 hover:bg-aqua-soft hover:text-navy"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div role="tablist" className="flex gap-1.5 overflow-x-auto pb-1">
          {tabs
            .filter((tab) => tab.key === "ALL" || counts[tab.key])
            .map((tab) => {
              const selected = tab.key === category;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setCategory(tab.key)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                    selected ? "bg-teal text-white" : "text-navy/70 hover:bg-aqua-soft hover:text-navy"
                  }`}
                >
                  {tab.label}
                  <bdi dir="ltr" className={`rounded-full px-1.5 text-[11px] ${selected ? "bg-white/20" : "bg-canvas text-navy/60"}`}>
                    {counts[tab.key] ?? 0}
                  </bdi>
                </button>
              );
            })}
        </div>
      </div>

      <p className="text-sm text-navy/60" aria-live="polite">
        <bdi dir="ltr">{visible.length}</bdi> {labels.documents}
      </p>

      {visible.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-navy/55">{labels.empty}</div>
      ) : (
        <ul className="grid gap-3">
          {visible.map((item) => (
            <li key={item.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
              <span className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-aqua-soft text-teal">
                <FileText className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className="badge-aqua">{item.categoryLabel}</span>
                  <bdi dir="ltr" className="badge-navy uppercase">
                    {item.fileType}
                  </bdi>
                  {item.fileSize && (
                    <bdi dir="ltr" className="badge-muted">
                      {item.fileSize}
                    </bdi>
                  )}
                  {item.year && (
                    <bdi dir="ltr" className="badge-muted">
                      {item.year}
                    </bdi>
                  )}
                </div>
                <h3 className="font-bold text-navy" dir="auto">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-navy/65" dir="auto">
                    {item.description}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-navy/45">{item.date}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <a href={item.fileUrl} target="_blank" rel="noopener" className="btn-outline px-3 py-2">
                  <Eye className="size-4" aria-hidden="true" />
                  {labels.view}
                </a>
                <a href={item.fileUrl} download className="btn-primary px-3 py-2">
                  <Download className="size-4" aria-hidden="true" />
                  {labels.download}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
