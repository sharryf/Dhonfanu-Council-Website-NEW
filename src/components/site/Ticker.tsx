import { Megaphone } from "lucide-react";

/** Urgent notice ticker. Items are separated by "|" in the CMS. */
export function Ticker({ text, label }: { text: string; label: string }) {
  const items = text
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (items.length === 0) return null;

  const duration = Math.max(25, Math.round(items.join(" ").length / 3.2));

  const group = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <li key={i} className="flex items-center whitespace-nowrap px-6 text-sm font-medium text-navy">
          <span className="me-6 size-1.5 rounded-full bg-teal" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="ticker flex items-stretch bg-aqua" role="region" aria-label={label}>
      <div className="z-10 flex shrink-0 items-center gap-2 bg-teal px-4 text-xs font-bold text-white sm:px-6">
        <Megaphone className="size-4" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className="min-w-0 flex-1 overflow-hidden py-2" tabIndex={0}>
        <div className="ticker-track" style={{ ["--ticker-duration" as string]: `${duration}s` }}>
          {group(false)}
          {group(true)}
        </div>
      </div>
    </div>
  );
}
