import { Search } from "lucide-react";

/** Unified search (announcements, news, downloads). Plain GET form — works without JavaScript. */
export function SearchForm({
  placeholder,
  buttonLabel,
  defaultValue = "",
  variant = "hero",
}: {
  placeholder: string;
  buttonLabel: string;
  defaultValue?: string;
  variant?: "hero" | "plain";
}) {
  return (
    <form
      action="/search"
      role="search"
      className={`flex items-center gap-2 rounded-2xl bg-white p-1.5 ${
        variant === "hero" ? "shadow-lift ring-1 ring-white/20" : "shadow-card ring-1 ring-navy/10"
      }`}
    >
      <label htmlFor={`q-${variant}`} className="sr-only">
        {buttonLabel}
      </label>
      <Search className="ms-3 size-5 shrink-0 text-teal" aria-hidden="true" />
      <input
        id={`q-${variant}`}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        required
        minLength={2}
        maxLength={80}
        dir="auto"
        className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-base text-navy placeholder:text-navy/40 focus:outline-none"
      />
      <button type="submit" className="btn-primary shrink-0 px-5 py-3">
        {buttonLabel}
      </button>
    </form>
  );
}
