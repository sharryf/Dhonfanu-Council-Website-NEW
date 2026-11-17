import Link from "next/link";
import { Compass } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/site";

export default async function NotFound() {
  const t = getDict(await getLocale());
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-aqua text-teal">
        <Compass className="size-8" aria-hidden="true" />
      </span>
      <p className="text-sm font-bold text-teal">
        <bdi dir="ltr">404</bdi>
      </p>
      <h1 className="mt-1 text-3xl font-extrabold text-navy">{t.notFound.title}</h1>
      <p className="mt-2 max-w-md text-navy/65">{t.notFound.text}</p>
      <Link href="/" className="btn-primary mt-6">
        {t.notFound.home}
      </Link>
    </div>
  );
}
