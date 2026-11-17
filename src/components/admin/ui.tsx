import Link from "next/link";
import { ArrowLeft, CircleCheck, Pencil, Plus } from "lucide-react";

export function AdminHeader({
  title,
  description,
  newHref,
  newLabel,
  backHref,
}: {
  title: string;
  description?: string;
  newHref?: string;
  newLabel?: string;
  backHref?: string;
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link href={backHref} className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to list
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
          {description && <p className="mt-0.5 max-w-2xl text-sm text-navy/60">{description}</p>}
        </div>
        {newHref && (
          <Link href={newHref} className="btn-primary">
            <Plus className="size-4" aria-hidden="true" />
            {newLabel ?? "Add new"}
          </Link>
        )}
      </div>
    </div>
  );
}

/** Banner shown after a redirect from a save/delete action. */
export function Flash({ saved, deleted }: { saved?: string; deleted?: string }) {
  if (!saved && !deleted) return null;
  return (
    <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-aqua px-4 py-2.5 text-sm font-semibold text-navy">
      <CircleCheck className="size-4 text-teal" aria-hidden="true" />
      {saved ? "Saved. The public site is already updated." : "Deleted."}
    </p>
  );
}

export function EditLink({ href }: { href: string }) {
  return (
    <Link href={href} className="btn-outline px-3 py-2">
      <Pencil className="size-4" aria-hidden="true" />
      Edit
    </Link>
  );
}

export function EmptyRow({ text }: { text: string }) {
  return <div className="card px-6 py-12 text-center text-sm text-navy/55">{text}</div>;
}

export function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "aqua" | "teal" | "navy" }) {
  const cls = { muted: "badge-muted", aqua: "badge-aqua", teal: "badge-teal", navy: "badge-navy" }[tone];
  return <span className={cls}>{children}</span>;
}
