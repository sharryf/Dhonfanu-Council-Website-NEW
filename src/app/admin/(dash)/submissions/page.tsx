import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDateTime, telHref } from "@/lib/format";
import { SUBMISSION_TYPE_LABELS, SUBMISSION_TYPES, oneOf } from "@/lib/constants";
import { ActionForm, ConfirmForm } from "@/components/admin/ActionForm";
import { Select, TextArea } from "@/components/admin/fields";
import { AdminHeader, EmptyRow, Pill } from "@/components/admin/ui";
import { deleteSubmission, updateSubmission } from "../../actions";

export const metadata = { title: "Citizen inbox" };

const PAGE_SIZE = 20;

export default async function SubmissionsAdmin({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = oneOf(["NEW", "RESOLVED", "ALL"] as const, sp.status, "NEW");
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const where = status === "ALL" ? {} : { status };

  const [items, total, newCount, resolvedCount] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: { service: { select: { titleEn: true, titleDv: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.submission.count({ where }),
    prisma.submission.count({ where: { status: "NEW" } }),
    prisma.submission.count({ where: { status: "RESOLVED" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const tabs = [
    { key: "NEW", label: "Unresolved", count: newCount },
    { key: "RESOLVED", label: "Resolved", count: resolvedCount },
    { key: "ALL", label: "All", count: newCount + resolvedCount },
  ];

  return (
    <>
      <AdminHeader title="Citizen inbox" description="Messages, complaints and service requests sent from the public Contact form." />

      <div className="mb-5 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/submissions?status=${t.key}`}
            aria-current={t.key === status ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              t.key === status ? "bg-teal text-white" : "bg-white text-navy/70 ring-1 ring-navy/10 hover:bg-aqua-soft"
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 text-xs ${t.key === status ? "bg-white/20" : "bg-canvas"}`}>{t.count}</span>
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyRow text={status === "NEW" ? "All caught up — no unresolved messages." : "No messages here."} />
      ) : (
        <ul className="grid gap-3">
          {items.map((s) => (
            <li key={s.id} id={`m-${s.id}`} className="card scroll-mt-20 target:ring-2 target:ring-teal">
              <details open={s.status === "NEW" && items.length <= 3}>
                <summary className="flex cursor-pointer list-none flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">
                    <span className="mb-1 flex flex-wrap gap-1.5">
                      <Pill tone={s.status === "NEW" ? "teal" : "muted"}>{s.status === "NEW" ? "New" : "Resolved"}</Pill>
                      <Pill tone={s.type === "COMPLAINT" ? "navy" : "aqua"}>{SUBMISSION_TYPE_LABELS[oneOf(SUBMISSION_TYPES, s.type, "INQUIRY")]}</Pill>
                      <Pill>{s.reference}</Pill>
                    </span>
                    <span className="block truncate font-semibold text-navy" dir="auto">
                      {s.subject || s.message.slice(0, 90)}
                    </span>
                    <span className="block text-xs text-navy/55">
                      <span dir="auto">{s.name}</span> · {formatDateTime(s.createdAt, "en")}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-teal">Open</span>
                </summary>

                <div className="grid gap-4 border-t border-navy/5 p-4 lg:grid-cols-[1fr_18rem]">
                  <div className="min-w-0">
                    <p className="whitespace-pre-line break-words rounded-xl bg-canvas p-4 text-sm text-navy" dir="auto">
                      {s.message}
                    </p>
                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      {s.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="size-4 text-teal" aria-hidden="true" />
                          <dt className="sr-only">Phone</dt>
                          <dd>
                            <a href={telHref(s.phone)} className="font-semibold text-navy hover:text-teal">
                              {s.phone}
                            </a>
                          </dd>
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="size-4 text-teal" aria-hidden="true" />
                          <dt className="sr-only">Email</dt>
                          <dd>
                            <a href={`mailto:${s.email}?subject=${encodeURIComponent(`Re: ${s.reference}`)}`} className="font-semibold text-navy hover:text-teal">
                              {s.email}
                            </a>
                          </dd>
                        </div>
                      )}
                      {s.service && (
                        <div className="flex items-center gap-1.5 text-navy/65">
                          <dt>Service:</dt>
                          <dd className="font-semibold text-navy">{s.service.titleEn || s.service.titleDv}</dd>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-navy/65">
                        <dt>Written in:</dt>
                        <dd className="font-semibold text-navy">{s.locale === "dv" ? "Dhivehi" : "English"}</dd>
                      </div>
                      {s.resolvedAt && (
                        <div className="flex items-center gap-1.5 text-navy/65">
                          <dt>Resolved:</dt>
                          <dd className="font-semibold text-navy">{formatDateTime(s.resolvedAt, "en")}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="grid content-start gap-3">
                    <ActionForm action={updateSubmission} inline className="grid gap-3" submitLabel="Update">
                      <input type="hidden" name="id" value={s.id} />
                      <Select
                        label="Status"
                        name="status"
                        defaultValue={s.status}
                        options={[
                          { value: "NEW", label: "Unresolved" },
                          { value: "RESOLVED", label: "Resolved" },
                        ]}
                      />
                      <TextArea label="Staff note (not public)" name="adminNote" defaultValue={s.adminNote} rows={3} />
                    </ActionForm>
                    <ConfirmForm action={deleteSubmission} id={s.id} confirmText="Delete this message permanently?" label="Delete message" />
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
          {page > 1 ? (
            <Link href={`/admin/submissions?status=${status}&page=${page - 1}`} className="btn-outline">
              Newer
            </Link>
          ) : (
            <span />
          )}
          <p className="text-sm text-navy/60">
            Page {page} of {pages}
          </p>
          {page < pages ? (
            <Link href={`/admin/submissions?status=${status}&page=${page + 1}`} className="btn-outline">
              Older
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
