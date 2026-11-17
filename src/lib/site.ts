import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { DEFAULT_LOCALE, LOCALE_COOKIE, getDict, isLocale, type Locale } from "./i18n";

/** Active language, read from the `locale` cookie (Dhivehi by default). */
export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

/** Site-wide settings. The single row is created on first use. */
export const getSite = cache(async () => {
  const existing = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.siteConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
});

export type Site = Awaited<ReturnType<typeof getSite>>;

/** Locale + dictionary + settings in one call, for pages. */
export async function getContext() {
  const [locale, site] = await Promise.all([getLocale(), getSite()]);
  return { locale, t: getDict(locale), site };
}

export const getPageContent = cache(async (key: string) => {
  return prisma.pageContent.findUnique({ where: { key } });
});
