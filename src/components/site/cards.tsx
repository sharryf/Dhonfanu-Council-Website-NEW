import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Download, Eye, Hash, Mail, Phone } from "lucide-react";
import type { Announcement, Member, News } from "@prisma/client";
import { pick, type Dict, type Locale } from "@/lib/i18n";
import { deadlineStatus, formatBytes, formatDate, formatDateTime, telHref } from "@/lib/format";
import { oneOf, ANNOUNCEMENT_CATEGORIES, NEWS_CATEGORIES } from "@/lib/constants";

export function StatusBadge({ deadline, t }: { deadline: Date | null; t: Dict }) {
  const status = deadlineStatus(deadline);
  if (status === null) return null;
  return status ? (
    <span className="badge-teal">
      <span className="size-1.5 rounded-full bg-aqua" aria-hidden="true" />
      {t.common.open}
    </span>
  ) : (
    <span className="badge-muted">{t.common.closed}</span>
  );
}

export function CategoryBadge({ category, t }: { category: string; t: Dict }) {
  const key = oneOf(ANNOUNCEMENT_CATEGORIES, category, "NOTICE");
  return <span className={key === "NOTICE" ? "badge-aqua" : "badge-navy"}>{t.annCatOne[key]}</span>;
}

export function AttachmentButtons({ url, size, t, compact = false }: { url: string; size?: number; t: Dict; compact?: boolean }) {
  if (!url) return null;
  const ext = (url.split(".").pop() || "file").toUpperCase();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={url} target="_blank" rel="noopener" className={compact ? "btn-outline px-3 py-1.5 text-xs" : "btn-outline"}>
        <Eye className="size-4" aria-hidden="true" />
        {t.common.view} <bdi dir="ltr">{ext}</bdi>
      </a>
      <a href={url} download className={compact ? "btn-primary px-3 py-1.5 text-xs" : "btn-primary"}>
        <Download className="size-4" aria-hidden="true" />
        {t.common.download}
        {size ? (
          <bdi dir="ltr" className="font-normal opacity-80">
            {formatBytes(size)}
          </bdi>
        ) : null}
      </a>
    </div>
  );
}

/** One row on the announcements board. */
export function AnnouncementItem({ item, locale, t }: { item: Announcement; locale: Locale; t: Dict }) {
  const title = pick(locale, item.titleEn, item.titleDv);
  return (
    <article className="card group relative flex flex-col gap-3 p-5 transition-shadow hover:shadow-lift sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <CategoryBadge category={item.category} t={t} />
          <StatusBadge deadline={item.deadline} t={t} />
          {item.refNumber && (
            <span className="inline-flex items-center gap-1 text-xs text-navy/55">
              <Hash className="size-3" aria-hidden="true" />
              <bdi dir="ltr">{item.refNumber}</bdi>
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-navy sm:text-lg" dir="auto">
          <Link href={`/announcements/${item.id}`} className="after:absolute after:inset-0 group-hover:text-teal">
            {title}
          </Link>
        </h3>
        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-navy/60">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-teal" aria-hidden="true" />
            <dt>{t.common.published}:</dt>
            <dd className="font-semibold text-navy/80">{formatDate(item.publishDate, locale)}</dd>
          </div>
          {item.deadline && (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-teal" aria-hidden="true" />
              <dt>{t.common.deadline}:</dt>
              <dd className="font-semibold text-navy/80">{formatDateTime(item.deadline, locale)}</dd>
            </div>
          )}
        </dl>
      </div>
      {item.attachmentUrl && (
        <div className="relative z-10 shrink-0">
          <AttachmentButtons url={item.attachmentUrl} size={item.attachmentSize} t={t} compact />
        </div>
      )}
    </article>
  );
}

export function NewsCard({ item, locale, t, large = false }: { item: News; locale: Locale; t: Dict; large?: boolean }) {
  const title = pick(locale, item.titleEn, item.titleDv);
  const excerpt = pick(locale, item.excerptEn, item.excerptDv);
  const cat = oneOf(NEWS_CATEGORIES, item.category, "COUNCIL");
  return (
    <article className="card group relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lift">
      <div className={`relative overflow-hidden bg-aqua-soft ${large ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
        <img
          src={item.imageUrl || "/images/placeholder.svg"}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="badge-aqua absolute start-3 top-3 shadow-sm">{t.newsCat[cat]}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-1.5 text-xs font-semibold text-teal">{formatDate(item.publishedAt, locale)}</p>
        <h3 className={`font-bold text-navy ${large ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`} dir="auto">
          <Link href={`/news/${item.slug}`} className="after:absolute after:inset-0 group-hover:text-teal">
            {title}
          </Link>
        </h3>
        {excerpt && (
          <p className={`mt-2 text-sm text-navy/65 ${large ? "line-clamp-3" : "line-clamp-2"}`} dir="auto">
            {excerpt}
          </p>
        )}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-teal">
          {t.common.readMore}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

export function MemberCard({ member, locale, t, featured = false }: { member: Member; locale: Locale; t: Dict; featured?: boolean }) {
  const name = pick(locale, member.nameEn, member.nameDv);
  const role = pick(locale, member.roleEn, member.roleDv);
  return (
    <article
      className={`card flex h-full items-center gap-4 p-5 ${
        featured ? "flex-col text-center sm:flex-row sm:gap-6 sm:p-7 sm:text-start" : "flex-col text-center"
      }`}
    >
      <img
        src={member.photoUrl || "/images/avatar.svg"}
        alt=""
        loading="lazy"
        className={`shrink-0 rounded-full bg-aqua-soft object-cover ring-4 ring-aqua/60 ${featured ? "size-28 sm:size-32" : "size-24"}`}
      />
      <div className="min-w-0">
        <p className={`font-semibold text-teal ${featured ? "text-sm" : "text-xs"}`} dir="auto">
          {role}
        </p>
        <h3 className={`font-bold text-navy ${featured ? "text-xl sm:text-2xl" : "text-base"}`} dir="auto">
          {name}
        </h3>
        {member.term && (
          <p className="mt-1 text-xs text-navy/55">
            {t.council.term}: <bdi dir="ltr">{member.term}</bdi>
          </p>
        )}
        {(member.phone || member.email) && (
          <div className={`mt-3 flex flex-wrap gap-2 ${featured ? "justify-center sm:justify-start" : "justify-center"}`}>
            {member.phone && (
              <a href={telHref(member.phone)} className="badge-muted hover:bg-aqua-soft">
                <Phone className="size-3" aria-hidden="true" />
                <bdi dir="ltr">{member.phone}</bdi>
              </a>
            )}
            {member.email && (
              <a href={`mailto:${member.email}`} className="badge-muted hover:bg-aqua-soft">
                <Mail className="size-3" aria-hidden="true" />
                <bdi dir="ltr">{member.email}</bdi>
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function SectionHeading({
  title,
  hint,
  href,
  linkLabel,
}: {
  title: string;
  hint?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {hint && <p className="mt-1 text-sm text-navy/60">{hint}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="btn-ghost shrink-0 px-3 py-2">
          {linkLabel}
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="card px-6 py-12 text-center text-sm text-navy/55">{text}</div>;
}
