import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { getContext, getLocale, getPageContent } from "@/lib/site";
import { getDict, pick } from "@/lib/i18n";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/site/PageHeader";
import { EmptyState } from "@/components/site/cards";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await getLocale());
  return { title: t.services.title, description: t.services.subtitle };
}

export default async function ServicesPage() {
  const { locale, t } = await getContext();
  const [services, intro] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: [{ order: "asc" }, { id: "asc" }] }),
    getPageContent("services.intro"),
  ]);
  const introText = pick(locale, intro?.bodyEn, intro?.bodyDv);

  const steps = [
    { title: t.services.step1Title, text: t.services.step1Text },
    { title: t.services.step2Title, text: t.services.step2Text },
    { title: t.services.step3Title, text: t.services.step3Text },
  ];

  return (
    <>
      <PageHeader title={t.services.title} subtitle={t.services.subtitle} homeLabel={t.nav.home} crumbs={[{ label: t.nav.services }]} />
      <div className="container-page mt-8 grid gap-10">
        {introText && (
          <p className="max-w-3xl text-base text-navy/75" dir="auto">
            {introText}
          </p>
        )}

        {services.length === 0 ? (
          <EmptyState text={t.services.empty} />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const external = /^https?:\/\//.test(s.linkUrl);
              const href = s.linkUrl || `/contact?type=SERVICE&service=${s.id}`;
              return (
                <li
                  key={s.id}
                  id={`service-${s.id}`}
                  className="card flex scroll-mt-32 flex-col p-6 transition-shadow hover:shadow-lift target:ring-2 target:ring-teal"
                >
                  <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-teal text-white">
                    <Icon name={s.icon} className="size-6" />
                  </span>
                  <h2 className="text-lg font-bold text-navy" dir="auto">
                    {pick(locale, s.titleEn, s.titleDv)}
                  </h2>
                  <p className="mt-1.5 flex-1 text-sm text-navy/65" dir="auto">
                    {pick(locale, s.descriptionEn, s.descriptionDv)}
                  </p>
                  {external ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="btn-outline mt-5 self-start">
                      {t.services.open}
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  ) : (
                    <Link href={href} className="btn-outline mt-5 self-start">
                      {s.linkUrl ? t.services.open : t.services.apply}
                      <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <section className="navy-pattern rounded-2xl p-6 text-white sm:p-10" aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-2xl font-bold">
            {t.services.howTitle}
          </h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal text-base font-bold">
                  <bdi dir="ltr">{i + 1}</bdi>
                </span>
                <div>
                  <h3 className="font-bold">{step.title}</h3>
                  <p className="mt-1 text-sm text-white/75">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
