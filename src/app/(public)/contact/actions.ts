"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/auth";
import { getLocale } from "@/lib/site";
import { SUBMISSION_TYPES, oneOf } from "@/lib/constants";

export type ContactState = {
  ok: boolean;
  error?: "required" | "email" | "long" | "rate" | "generic";
  reference?: string;
} | null;

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/** Public citizen inquiry / complaint form → Submission table. */
export async function submitContact(_prev: ContactState, fd: FormData): Promise<ContactState> {
  try {
    // Honeypot: real visitors never see or fill this field.
    if (text(fd, "website")) return { ok: true, reference: "DC-0000" };

    const h = await headers();
    const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
    if (!rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)) return { ok: false, error: "rate" };

    const name = text(fd, "name");
    const phone = text(fd, "phone");
    const email = text(fd, "email");
    const subject = text(fd, "subject");
    const message = text(fd, "message");
    const type = oneOf(SUBMISSION_TYPES, text(fd, "type"), "INQUIRY");

    if (name.length < 2 || message.length < 5 || (!phone && !email)) return { ok: false, error: "required" };
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "email" };
    if (name.length > 100 || phone.length > 30 || email.length > 120 || subject.length > 150 || message.length > 4000) {
      return { ok: false, error: "long" };
    }

    const serviceIdRaw = Number.parseInt(text(fd, "serviceId"), 10);
    const service = Number.isInteger(serviceIdRaw)
      ? await prisma.service.findUnique({ where: { id: serviceIdRaw }, select: { id: true } })
      : null;

    const created = await prisma.submission.create({
      data: {
        reference: `pending-${randomUUID()}`,
        type,
        name,
        phone,
        email,
        subject,
        message,
        serviceId: service?.id ?? null,
        locale: await getLocale(),
      },
    });
    const reference = `DC-${new Date().getFullYear()}-${String(created.id).padStart(5, "0")}`;
    await prisma.submission.update({ where: { id: created.id }, data: { reference } });

    revalidatePath("/admin", "layout");
    return { ok: true, reference };
  } catch (err) {
    console.error("submitContact failed", err);
    return { ok: false, error: "generic" };
  }
}
