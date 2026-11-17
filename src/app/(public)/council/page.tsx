import type { Metadata } from "next";
import { Compass, Lightbulb } from "lucide-react";
import { prisma } from "@/lib/db";
import { getContext, getLocale, getPageContent } from "@/lib/site";
import { getDict, pick } from "@/lib/i18n";
import { PageHeader } from "@/components/site/PageHeader";
import { EmptyState, MemberCard } from "@/components/site/cards";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await getLocale());
  return { title: t.council.title, description: t.council.subtitle };
}

export default async function CouncilPage() {
  const { locale, t } = await getContext();
  const [members, mission, vision] = await Promise.all([
    prisma.member.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
    getPageContent("council.mission"),
    getPageContent("council.vision"),
  ]);

  const council = members.filter((m) => m.group === "COUNCIL");
  const wdc = members.filter((m) => m.group === "WDC");
  const admin = members.filter((m) => m.group === "ADMIN");
  const [president, ...councillors] = council;

  const statements = [
    { icon: Compass, label: t.council.mission, content: mission },
    { icon: Lightbulb, label: t.council.vision, content: vision },
  ].filter((s) => s.content && pick(locale, s.content.bodyEn, s.content.bodyDv));

  const groups = [
    { id: "wdc", title: t.council.wdc, hint: t.council.wdcHint, list: wdc },
    { id: "secretariat", title: t.council.admin, hint: t.council.adminHint, list: admin },
  ].filter((g) => g.list.length > 0);

  return (
    <>
      <PageHeader title={t.council.title} subtitle={t.council.subtitle} homeLabel={t.nav.home} crumbs={[{ label: t.nav.council }]} />
      <div className="container-page mt-8 grid gap-12">
        {statements.length > 0 && (
          <section className="grid gap-5 md:grid-cols-2">
            {statements.map((s) => (
              <div key={s.label} className="card border-s-4 border-teal p-6">
                <div className="mb-2 flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-aqua-soft text-teal">
                    <s.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h2 className="text-lg font-bold text-navy">{s.label}</h2>
                </div>
                <p className="text-sm text-navy/75 sm:text-base" dir="auto">
                  {pick(locale, s.content?.bodyEn, s.content?.bodyDv)}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Council hierarchy: president first, then the other members */}
        <section aria-labelledby="council-heading">
          <h2 id="council-heading" className="section-title">
            {t.council.councillors}
          </h2>
          <p className="mb-6 mt-1 text-sm text-navy/60">{t.council.councillorsHint}</p>
          {!president ? (
            <EmptyState text={t.common.noResults} />
          ) : (
            <div className="grid gap-5">
              <div className="mx-auto w-full max-w-2xl">
                <MemberCard member={president} locale={locale} t={t} featured />
              </div>
              {councillors.length > 0 && (
                <>
                  <div className="mx-auto h-6 w-px bg-aqua" aria-hidden="true" />
                  <div className="mx-auto -mt-5 grid w-full max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-3 [&>*:only-child]:sm:col-span-2 [&>*:only-child]:lg:col-span-3">
                    {councillors.map((m) => (
                      <MemberCard key={m.id} member={m} locale={locale} t={t} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {groups.map((g) => (
          <section key={g.id} aria-labelledby={`${g.id}-heading`}>
            <h2 id={`${g.id}-heading`} className="section-title">
              {g.title}
            </h2>
            <p className="mb-6 mt-1 text-sm text-navy/60">{g.hint}</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {g.list.map((m) => (
                <MemberCard key={m.id} member={m} locale={locale} t={t} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
