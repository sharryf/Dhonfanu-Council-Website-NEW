"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { destroySession, requireAdmin } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { parseLocalInput, slugify } from "@/lib/format";
import { cleanRichText } from "@/lib/sanitize";
import { removeUpload, saveUpload, UploadError, type SavedUpload } from "@/lib/uploads";
import {
  ANNOUNCEMENT_CATEGORIES,
  DOCUMENT_CATEGORIES,
  MEMBER_GROUPS,
  NEWS_CATEGORIES,
  PAGE_KEYS,
  oneOf,
} from "@/lib/constants";
import { ICON_NAMES } from "@/components/Icon";

// --- helpers ----------------------------------------------------------------

const str = (fd: FormData, key: string, max = 5000) => String(fd.get(key) ?? "").trim().slice(0, max);
const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "true";
const int = (fd: FormData, key: string, fallback = 0) => {
  const n = Number.parseInt(String(fd.get(key) ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
};
const idOf = (fd: FormData) => {
  const n = Number.parseInt(String(fd.get("id") ?? ""), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};
const fail = (message: string): FormState => ({ ok: false, message });
const done = (message = "Saved."): FormState => ({ ok: true, message });
const icon = (fd: FormData) => oneOf(ICON_NAMES, str(fd, "icon"), "FileText");

function safeUrl(value: string): string {
  if (!value) return "";
  return /^(https?:\/\/|\/(?!\/))/i.test(value) ? value : "";
}

/** Public pages read the database on every request; this refreshes cached admin views too. */
function refresh() {
  revalidatePath("/", "layout");
}

/**
 * Handles a FileInput: returns the new upload, "removed" when the box was
 * ticked, or null when the current file should be kept.
 */
async function fileChange(fd: FormData, name: string, kind: "image" | "document"): Promise<SavedUpload | "removed" | null> {
  const saved = await saveUpload(fd.get(name), kind);
  if (saved) return saved;
  return bool(fd, `${name}Remove`) ? "removed" : null;
}

function errorMessage(err: unknown): string {
  if (err instanceof UploadError) return err.message;
  console.error(err);
  return "Something went wrong while saving. Please try again.";
}

// --- session ----------------------------------------------------------------

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const name = str(fd, "name", 80);

  const user = await prisma.adminUser.findUnique({ where: { id: session.uid } });
  if (!user) return fail("Account not found.");

  if (!next && !current) {
    await prisma.adminUser.update({ where: { id: user.id }, data: { name } });
    return done("Profile updated.");
  }
  if (!(await bcrypt.compare(current, user.passwordHash))) return fail("The current password is not correct.");
  if (next.length < 10) return fail("The new password must be at least 10 characters long.");
  if (next !== confirm) return fail("The new passwords do not match.");

  await prisma.adminUser.update({ where: { id: user.id }, data: { name, passwordHash: await bcrypt.hash(next, 12) } });
  return done("Password changed.");
}

// --- site settings ----------------------------------------------------------

export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    const existing = await prisma.siteConfig.findUnique({ where: { id: 1 } });
    const logo = await fileChange(fd, "logo", "image");
    const hero = await fileChange(fd, "heroImage", "image");

    const lat = Number.parseFloat(str(fd, "mapLat"));
    const lng = Number.parseFloat(str(fd, "mapLng"));
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      return fail("Map coordinates are not valid. Latitude must be between -90 and 90, longitude between -180 and 180.");
    }
    if (!str(fd, "councilNameEn") && !str(fd, "councilNameDv")) return fail("Enter the council name in at least one language.");

    const data = {
      councilNameEn: str(fd, "councilNameEn", 120),
      councilNameDv: str(fd, "councilNameDv", 120),
      taglineEn: str(fd, "taglineEn", 300),
      taglineDv: str(fd, "taglineDv", 300),
      heroTitleEn: str(fd, "heroTitleEn", 160),
      heroTitleDv: str(fd, "heroTitleDv", 160),
      heroSubtitleEn: str(fd, "heroSubtitleEn", 400),
      heroSubtitleDv: str(fd, "heroSubtitleDv", 400),
      tickerEnabled: bool(fd, "tickerEnabled"),
      tickerEn: str(fd, "tickerEn", 1000),
      tickerDv: str(fd, "tickerDv", 1000),
      hotline: str(fd, "hotline", 30),
      phone: str(fd, "phone", 30),
      viber: str(fd, "viber", 30),
      email: str(fd, "email", 120),
      officeHoursEn: str(fd, "officeHoursEn", 200),
      officeHoursDv: str(fd, "officeHoursDv", 200),
      addressEn: str(fd, "addressEn", 300),
      addressDv: str(fd, "addressDv", 300),
      mapLat: lat,
      mapLng: lng,
      mapZoom: Math.min(19, Math.max(3, int(fd, "mapZoom", 15))),
      facebookUrl: safeUrl(str(fd, "facebookUrl", 300)),
      twitterUrl: safeUrl(str(fd, "twitterUrl", 300)),
      instagramUrl: safeUrl(str(fd, "instagramUrl", 300)),
      youtubeUrl: safeUrl(str(fd, "youtubeUrl", 300)),
      footerNoteEn: str(fd, "footerNoteEn", 300),
      footerNoteDv: str(fd, "footerNoteDv", 300),
      ...(logo ? { logoUrl: logo === "removed" ? "" : logo.url } : {}),
      ...(hero ? { heroImageUrl: hero === "removed" ? "" : hero.url } : {}),
    };

    await prisma.siteConfig.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
    if (logo) await removeUpload(existing?.logoUrl);
    if (hero) await removeUpload(existing?.heroImageUrl);
  } catch (err) {
    return fail(errorMessage(err));
  }
  refresh();
  return done("Site settings saved.");
}

// --- announcements ----------------------------------------------------------

export async function saveAnnouncement(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idOf(fd);
  try {
    const titleEn = str(fd, "titleEn", 300);
    const titleDv = str(fd, "titleDv", 300);
    if (!titleEn && !titleDv) return fail("Enter a title in at least one language.");

    const publishDate = parseLocalInput(str(fd, "publishDate")) ?? new Date();
    const deadlineRaw = str(fd, "deadline");
    const deadline = deadlineRaw ? parseLocalInput(deadlineRaw) : null;
    if (deadlineRaw && !deadline) return fail("The deadline is not a valid date and time.");

    const existing = id ? await prisma.announcement.findUnique({ where: { id } }) : null;
    if (id && !existing) return fail("This announcement no longer exists.");
    const file = await fileChange(fd, "attachment", "document");

    const data = {
      refNumber: str(fd, "refNumber", 80),
      category: oneOf(ANNOUNCEMENT_CATEGORIES, str(fd, "category"), "NOTICE"),
      titleEn,
      titleDv,
      contentEn: str(fd, "contentEn", 20000),
      contentDv: str(fd, "contentDv", 20000),
      publishDate,
      deadline,
      published: bool(fd, "published"),
      ...(file === "removed" ? { attachmentUrl: "", attachmentName: "", attachmentSize: 0 } : {}),
      ...(file && file !== "removed" ? { attachmentUrl: file.url, attachmentName: file.name, attachmentSize: file.size } : {}),
    };

    if (existing) await prisma.announcement.update({ where: { id: existing.id }, data });
    else await prisma.announcement.create({ data });
    if (file) await removeUpload(existing?.attachmentUrl);
  } catch (err) {
    return fail(errorMessage(err));
  }
  refresh();
  redirect("/admin/announcements?saved=1");
}

export async function deleteAnnouncement(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  if (id) {
    const item = await prisma.announcement.findUnique({ where: { id } });
    if (item) {
      await prisma.announcement.delete({ where: { id } });
      await removeUpload(item.attachmentUrl);
    }
  }
  refresh();
  redirect("/admin/announcements?deleted=1");
}

// --- news -------------------------------------------------------------------

async function uniqueSlug(base: string, ignoreId?: number): Promise<string> {
  const root = slugify(base) || `news-${Date.now().toString(36)}`;
  let slug = root;
  for (let i = 2; i < 100; i += 1) {
    const clash = await prisma.news.findUnique({ where: { slug } });
    if (!clash || clash.id === ignoreId) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function saveNews(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idOf(fd);
  try {
    const titleEn = str(fd, "titleEn", 300);
    const titleDv = str(fd, "titleDv", 300);
    if (!titleEn && !titleDv) return fail("Enter a title in at least one language.");

    const existing = id ? await prisma.news.findUnique({ where: { id } }) : null;
    if (id && !existing) return fail("This article no longer exists.");
    const image = await fileChange(fd, "image", "image");

    const data = {
      slug: await uniqueSlug(str(fd, "slug", 100) || existing?.slug || titleEn, existing?.id),
      titleEn,
      titleDv,
      excerptEn: str(fd, "excerptEn", 500),
      excerptDv: str(fd, "excerptDv", 500),
      contentEn: cleanRichText(String(fd.get("contentEn") ?? "")),
      contentDv: cleanRichText(String(fd.get("contentDv") ?? "")),
      category: oneOf(NEWS_CATEGORIES, str(fd, "category"), "COUNCIL"),
      published: bool(fd, "published"),
      featured: bool(fd, "featured"),
      publishedAt: parseLocalInput(str(fd, "publishedAt")) ?? existing?.publishedAt ?? new Date(),
      ...(image ? { imageUrl: image === "removed" ? "" : image.url } : {}),
    };

    if (existing) await prisma.news.update({ where: { id: existing.id }, data });
    else await prisma.news.create({ data });
    if (image) await removeUpload(existing?.imageUrl);
  } catch (err) {
    return fail(errorMessage(err));
  }
  refresh();
  redirect("/admin/news?saved=1");
}

export async function deleteNews(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  if (id) {
    const item = await prisma.news.findUnique({ where: { id } });
    if (item) {
      await prisma.news.delete({ where: { id } });
      await removeUpload(item.imageUrl);
    }
  }
  refresh();
  redirect("/admin/news?deleted=1");
}

// --- council / WDC / staff --------------------------------------------------

export async function saveMember(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idOf(fd);
  try {
    const nameEn = str(fd, "nameEn", 120);
    const nameDv = str(fd, "nameDv", 120);
    if (!nameEn && !nameDv) return fail("Enter a name in at least one language.");

    const existing = id ? await prisma.member.findUnique({ where: { id } }) : null;
    if (id && !existing) return fail("This person no longer exists.");
    const photo = await fileChange(fd, "photo", "image");

    const data = {
      group: oneOf(MEMBER_GROUPS, str(fd, "group"), "COUNCIL"),
      nameEn,
      nameDv,
      roleEn: str(fd, "roleEn", 160),
      roleDv: str(fd, "roleDv", 160),
      term: str(fd, "term", 40),
      email: str(fd, "email", 120),
      phone: str(fd, "phone", 30),
      order: int(fd, "order", 0),
      ...(photo ? { photoUrl: photo === "removed" ? "" : photo.url } : {}),
    };

    if (existing) await prisma.member.update({ where: { id: existing.id }, data });
    else await prisma.member.create({ data });
    if (photo) await removeUpload(existing?.photoUrl);
  } catch (err) {
    return fail(errorMessage(err));
  }
  refresh();
  redirect("/admin/members?saved=1");
}

export async function deleteMember(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  if (id) {
    const item = await prisma.member.findUnique({ where: { id } });
    if (item) {
      await prisma.member.delete({ where: { id } });
      await removeUpload(item.photoUrl);
    }
  }
  refresh();
  redirect("/admin/members?deleted=1");
}

// --- downloads --------------------------------------------------------------

export async function saveDocument(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idOf(fd);
  try {
    const titleEn = str(fd, "titleEn", 300);
    const titleDv = str(fd, "titleDv", 300);
    if (!titleEn && !titleDv) return fail("Enter a title in at least one language.");

    const existing = id ? await prisma.document.findUnique({ where: { id } }) : null;
    if (id && !existing) return fail("This document no longer exists.");
    const file = await saveUpload(fd.get("file"), "document");
    if (!file && !existing?.fileUrl) return fail("Choose a file to upload.");

    const yearRaw = int(fd, "year", 0);
    const data = {
      category: oneOf(DOCUMENT_CATEGORIES, str(fd, "category"), "FORM"),
      titleEn,
      titleDv,
      descriptionEn: str(fd, "descriptionEn", 500),
      descriptionDv: str(fd, "descriptionDv", 500),
      year: yearRaw >= 1900 && yearRaw <= 2200 ? yearRaw : null,
      published: bool(fd, "published"),
      publishedAt: parseLocalInput(str(fd, "publishedAt")) ?? existing?.publishedAt ?? new Date(),
      ...(file ? { fileUrl: file.url, fileName: file.name, fileType: file.ext, fileSize: file.size } : {}),
    };

    if (existing) await prisma.document.update({ where: { id: existing.id }, data });
    else await prisma.document.create({ data });
    if (file) await removeUpload(existing?.fileUrl);
  } catch (err) {
    return fail(errorMessage(err));
  }
  refresh();
  redirect("/admin/documents?saved=1");
}

export async function deleteDocument(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  if (id) {
    const item = await prisma.document.findUnique({ where: { id } });
    if (item) {
      await prisma.document.delete({ where: { id } });
      await removeUpload(item.fileUrl);
    }
  }
  refresh();
  redirect("/admin/documents?deleted=1");
}

// --- e-services -------------------------------------------------------------

export async function saveService(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idOf(fd);
  try {
    const titleEn = str(fd, "titleEn", 160);
    const titleDv = str(fd, "titleDv", 160);
    if (!titleEn && !titleDv) return fail("Enter a title in at least one language.");
    const linkRaw = str(fd, "linkUrl", 300);
    if (linkRaw && !safeUrl(linkRaw)) return fail('The link must start with "/" (a page on this site) or "https://".');

    const data = {
      titleEn,
      titleDv,
      descriptionEn: str(fd, "descriptionEn", 600),
      descriptionDv: str(fd, "descriptionDv", 600),
      icon: icon(fd),
      linkUrl: linkRaw,
      featured: bool(fd, "featured"),
      active: bool(fd, "active"),
      order: int(fd, "order", 0),
    };
    if (id) await prisma.service.update({ where: { id }, data });
    else await prisma.service.create({ data });
  } catch (err) {
    return fail(errorMessage(err));
  }
  refresh();
  redirect("/admin/services?saved=1");
}

export async function deleteService(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  if (id) await prisma.service.deleteMany({ where: { id } });
  refresh();
  redirect("/admin/services?deleted=1");
}

// --- island profile: text blocks, statistics, facilities --------------------

export async function savePageContent(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    const key = str(fd, "key", 60);
    const def = PAGE_KEYS.find((p) => p.key === key);
    if (!def) return fail("Unknown content block.");

    const existing = await prisma.pageContent.findUnique({ where: { key } });
    const image = def.hasImage ? await fileChange(fd, "image", "image") : null;
    const data = {
      titleEn: str(fd, "titleEn", 200),
      titleDv: str(fd, "titleDv", 200),
      bodyEn: str(fd, "bodyEn", 10000),
      bodyDv: str(fd, "bodyDv", 10000),
      ...(image ? { imageUrl: image === "removed" ? "" : image.url } : {}),
    };
    await prisma.pageContent.upsert({ where: { key }, update: data, create: { key, ...data } });
    if (image) await removeUpload(existing?.imageUrl);
  } catch (err) {
    return fail(errorMessage(err));
  }
  refresh();
  return done();
}

export async function saveStat(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idOf(fd);
  try {
    const labelEn = str(fd, "labelEn", 80);
    const labelDv = str(fd, "labelDv", 80);
    const value = str(fd, "value", 30);
    if ((!labelEn && !labelDv) || !value) return fail("A label and a value are required.");
    const data = { labelEn, labelDv, value, unitEn: str(fd, "unitEn", 20), unitDv: str(fd, "unitDv", 20), icon: icon(fd), order: int(fd, "order", 0) };
    if (id) await prisma.islandStat.update({ where: { id }, data });
    else await prisma.islandStat.create({ data });
  } catch (err) {
    return fail(errorMessage(err));
  }
  refresh();
  return done(id ? "Saved." : "Added.");
}

export async function deleteStat(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  if (id) await prisma.islandStat.deleteMany({ where: { id } });
  refresh();
}

export async function saveFacility(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idOf(fd);
  try {
    const nameEn = str(fd, "nameEn", 120);
    const nameDv = str(fd, "nameDv", 120);
    if (!nameEn && !nameDv) return fail("Enter a name in at least one language.");
    const data = {
      nameEn,
      nameDv,
      descriptionEn: str(fd, "descriptionEn", 300),
      descriptionDv: str(fd, "descriptionDv", 300),
      phone: str(fd, "phone", 30),
      icon: icon(fd),
      order: int(fd, "order", 0),
    };
    if (id) await prisma.facility.update({ where: { id }, data });
    else await prisma.facility.create({ data });
  } catch (err) {
    return fail(errorMessage(err));
  }
  refresh();
  return done(id ? "Saved." : "Added.");
}

export async function deleteFacility(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  if (id) await prisma.facility.deleteMany({ where: { id } });
  refresh();
}

// --- citizen submissions inbox ----------------------------------------------

export async function updateSubmission(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idOf(fd);
  if (!id) return fail("Unknown message.");
  try {
    const status = oneOf(["NEW", "RESOLVED"] as const, str(fd, "status"), "NEW");
    const existing = await prisma.submission.findUnique({ where: { id } });
    if (!existing) return fail("This message no longer exists.");
    await prisma.submission.update({
      where: { id },
      data: {
        status,
        adminNote: str(fd, "adminNote", 2000),
        resolvedAt: status === "RESOLVED" ? (existing.resolvedAt ?? new Date()) : null,
      },
    });
  } catch (err) {
    return fail(errorMessage(err));
  }
  refresh();
  return done("Updated.");
}

export async function deleteSubmission(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  if (id) await prisma.submission.deleteMany({ where: { id } });
  refresh();
}
