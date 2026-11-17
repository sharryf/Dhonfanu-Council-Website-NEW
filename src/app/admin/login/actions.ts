"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, rateLimit } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";

// Compared against when the username is unknown, so response time does not reveal valid usernames.
const DUMMY_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8.YeF3zY8L5mYv1oQ3F0mJ0yqZ8x6W";

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = String(fd.get("next") ?? "");

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
  if (!rateLimit(`login:${ip}`, 8, 15 * 60 * 1000)) {
    return { ok: false, message: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }
  if (!username || !password) return { ok: false, message: "Enter your username and password." };

  const user = await prisma.adminUser.findUnique({ where: { username } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return { ok: false, message: "The username or password is not correct." };

  await createSession({ uid: user.id, username: user.username });
  // Only allow redirects back into the admin area.
  redirect(/^\/admin(\/[\w\-/]*)?$/.test(next) ? next : "/admin");
}
