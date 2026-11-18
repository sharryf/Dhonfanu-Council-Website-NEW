/**
 * Installs the sample hero video (prisma/seed-assets/hero-sample.mp4 or .webm)
 * and sets it as the home page background video.
 *
 * Safe to run on a live site: it only touches the hero video setting and never
 * deletes content. By default it leaves an existing hero video alone.
 *
 *   npm run db:seed-video             → install the sample if no video is set
 *   npm run db:seed-video -- --force  → replace the current hero video
 *
 * Replace or remove the video any time in /admin/settings.
 */
import { PrismaClient } from "@prisma/client";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import path from "path";

export async function seedHeroVideo(prisma: PrismaClient, { force = false } = {}): Promise<boolean> {
  const assets = path.join(process.cwd(), "prisma", "seed-assets");
  const file = existsSync(assets) ? readdirSync(assets).find((f) => /^hero-sample\.(mp4|webm)$/.test(f)) : undefined;
  if (!file) {
    console.log("No sample hero video found in prisma/seed-assets — skipped.");
    return false;
  }

  const site = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  if (site?.heroVideoUrl && !force) {
    console.log("A hero video is already set — left unchanged (use --force to replace it).");
    return false;
  }

  const dest = path.join(process.cwd(), "public", "uploads", "seed");
  mkdirSync(dest, { recursive: true });
  copyFileSync(path.join(assets, file), path.join(dest, file));

  const url = `/uploads/seed/${file}`;
  await prisma.siteConfig.upsert({ where: { id: 1 }, update: { heroVideoUrl: url }, create: { id: 1, heroVideoUrl: url } });
  console.log(`Sample hero video installed: ${url}`);
  return true;
}

// Run directly (tsx prisma/seed-hero-video.ts); not when imported by seed.ts.
if (/seed-hero-video\.(ts|js)$/.test((process.argv[1] ?? "").replace(/\\/g, "/"))) {
  const prisma = new PrismaClient();
  seedHeroVideo(prisma, { force: process.argv.includes("--force") })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
