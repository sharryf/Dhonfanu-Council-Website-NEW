import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  crumbs = [],
  homeLabel,
}: {
  title: string;
  subtitle?: string;
  crumbs?: { href?: string; label: string }[];
  homeLabel: string;
}) {
  return (
    <div className="navy-pattern text-white">
      <div className="container-page py-9 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-3 text-xs text-aqua/90">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-white hover:underline">
                {homeLabel}
              </Link>
            </li>
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <ChevronRight className="size-3 rtl:rotate-180" aria-hidden="true" />
                {c.href ? (
                  <Link href={c.href} className="hover:text-white hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-white/70" dir="auto">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="max-w-3xl text-3xl font-bold sm:text-4xl" dir="auto">
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-white/75 sm:text-base">{subtitle}</p>}
      </div>
    </div>
  );
}
