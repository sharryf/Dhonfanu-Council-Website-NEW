import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Hash, Paperclip } from "lucide-react";
import { prisma } from "@/lib/db";
import { getContext, getLocale } from "@/lib/site";
import { pick } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/site/PageHeader";
import { AttachmentButtons, CategoryBadge, StatusBadge } from "@/components/site/cards";

type Props = { params: Promise<{ id: string }> };

async function load(idParam: string) {
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id < 1) return null;
  return prisma.announcement.findFirst({ where: { id, published: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await load((await params).id);
  if (!item) return {};
  const locale = await getLocale();
  return { title: pick(locale, item.titleEn, item.titleDv) };
}

export default async function AnnouncementPage({ params }: Props) {
  const item = await load((await params).id);
  if (!item) notFound();
  const { locale, t } = await getContext();
  const title = pick(locale, item.titleEn, item.titleDv);
  const content = pick(locale, item.contentEn, item.contentDv);

  return (
    <>
      <PageHeader
        title={title}
        homeLabel={t.nav.home}
        crumbs={[{ href: "/announcements", label: t.nav.announcements }, { label: item.refNumber || title }]}
      />
      <div className="container-page mt-8 grid gap-6 lg:grid-cols-[1fr_19rem]">
        <article className="card p-6 sm:p-9">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <CategoryBadge category={item.category} t={t} />
            <StatusBadge deadline={item.deadline} t={t} />
          </div>
          {content ? (
            <div className="prose-civic whitespace-pre-line" dir="auto">
              {content}
            </div>
          ) : (
            <p className="text-sm text-navy/55">{t.common.noResults}</p>
          )}
          {item.attachmentUrl && (
            <div className="mt-8 rounded-xl bg-aqua-soft p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <p className="mb-3 flex min-w-0 items-center gap-2 text-sm font-semibold text-navy sm:mb-0">
                <Paperclip className="size-4 shrink-0 text-teal" aria-hidden="true" />
                <span className="truncate" dir="auto">
                  {item.attachmentName || t.common.attachment}
                </span>
              </p>
              <AttachmentButtons url={item.attachmentUrl} size={item.attachmentSize} t={t} />
            </div>
          )}
        </article>

        <aside className="grid content-start gap-4">
          <dl className="card divide-y divide-navy/5 text-sm">
            {item.refNumber && (
              <div className="flex items-start gap-3 p-4">
                <Hash className="mt-1 size-4 shrink-0 text-teal" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-navy/55">{t.common.refNo}</dt>
                  <dd className="font-semibold text-navy">
                    <bdi dir="ltr">{item.refNumber}</bdi>
                  </dd>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-4">
              <CalendarDays className="mt-1 size-4 shrink-0 text-teal" aria-hidden="true" />
              <div>
                <dt className="text-xs text-navy/55">{t.common.published}</dt>
                <dd className="font-semibold text-navy">{formatDate(item.publishDate, locale)}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4">
              <Clock className="mt-1 size-4 shrink-0 text-teal" aria-hidden="true" />
              <div>
                <dt className="text-xs text-navy/55">{t.common.deadline}</dt>
                <dd className="font-semibold text-navy">
                  {item.deadline ? formatDateTime(item.deadline, locale) : t.announcements.noDeadline}
                </dd>
              </div>
            </div>
          </dl>
          <Link href="/announcements" className="btn-outline">
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {t.announcements.backToList}
          </Link>
        </aside>
      </div>
    </>
  );
}
