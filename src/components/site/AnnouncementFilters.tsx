"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

type Tab = { key: string; label: string; count: number };

/** Category tabs + debounced search. State lives in the URL so results are shareable. */
export function AnnouncementFilters({
  tabs,
  active,
  query,
  placeholder,
  clearLabel,
}: {
  tabs: Tab[];
  active: string;
  query: string;
  placeholder: string;
  clearLabel: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hrefFor = (category: string, q: string) => {
    const params = new URLSearchParams();
    if (category !== "ALL") params.set("category", category);
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    return qs ? `/announcements?${qs}` : "/announcements";
  };

  function update(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      startTransition(() => router.replace(hrefFor(active, next), { scroll: false }));
    }, 250);
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <div className="card flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
      <div role="tablist" className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0">
        {tabs.map((tab) => {
          const selected = tab.key === active;
          return (
            <Link
              key={tab.key}
              href={hrefFor(tab.key, value)}
              role="tab"
              aria-selected={selected}
              scroll={false}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                selected ? "bg-teal text-white" : "text-navy/70 hover:bg-aqua-soft hover:text-navy"
              }`}
            >
              {tab.label}
              <bdi
                dir="ltr"
                className={`rounded-full px-1.5 text-[11px] ${selected ? "bg-white/20 text-white" : "bg-canvas text-navy/60"}`}
              >
                {tab.count}
              </bdi>
            </Link>
          );
        })}
      </div>
      <form action="/announcements" className="relative lg:w-80" onSubmit={(e) => e.preventDefault()} role="search">
        <Search
          className={`pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 ${pending ? "animate-pulse text-teal" : "text-navy/40"}`}
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => update(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={80}
          dir="auto"
          className="input ps-9 pe-9 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => update("")}
            aria-label={clearLabel}
            className="absolute end-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-navy/50 hover:bg-aqua-soft hover:text-navy"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </form>
    </div>
  );
}
