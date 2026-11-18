/**
 * Seed script — fills every table with realistic DEMONSTRATION data for
 * Dhonfanu Council (B. Dhonfanu, Maldives) in English and Dhivehi.
 *
 * All names, phone numbers, reference numbers, figures and documents below are
 * placeholders for the client demo. Replace them from /admin before going live.
 *
 *   npx prisma db seed            → seeds an empty database
 *   SEED_FORCE=1 npx prisma db seed → wipes existing content first
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdirSync, writeFileSync, statSync } from "fs";
import path from "path";
import { seedHeroVideo } from "./seed-hero-video";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number, hour = 14) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour - 5, 0, 0, 0); // Maldives time is UTC+5
  return d;
};
const YEAR = new Date().getFullYear();

// --- minimal PDF writer (so every download link works out of the box) --------

const SEED_DIR = path.join(process.cwd(), "public", "uploads", "seed");

function makePdf(title: string, lines: string[], pages = 1): Buffer {
  const esc = (s: string) => s.replace(/[^\x20-\x7E]/g, "-").replace(/([\\()])/g, "\\$1");
  const objects: string[] = [];
  const add = (body: string) => objects.push(body);
  const catalogId = add("");
  const pagesId = add("");
  const bold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const regular = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const filler = [
    "This page is part of a sample document generated for the portal demonstration.",
    "Replace this file with the official signed document from the Admin dashboard:",
    "Admin > Downloads (or Announcements) > Edit > Replace file.",
  ];
  const kids: number[] = [];

  for (let p = 0; p < pages; p += 1) {
    let c = "";
    c += "0.027 0.106 0.169 rg 0 772 595 70 re f\n";
    c += "0.086 0.490 0.553 rg 0 766 595 6 re f\n";
    c += `BT 1 1 1 rg /F1 16 Tf 50 808 Td (${esc("Dhonfanu Council")}) Tj ET\n`;
    c += `BT 0.725 0.894 0.910 rg /F2 9 Tf 50 790 Td (${esc("Secretariat of the Dhonfanu Council, South Maalhosmadulu, Republic of Maldives")}) Tj ET\n`;
    c += `BT 0.027 0.106 0.169 rg /F1 17 Tf 50 722 Td (${esc(title)}) Tj ET\n`;
    c += "0.725 0.894 0.910 rg 50 706 120 3 re f\n";
    let y = 676;
    for (const line of p === 0 ? lines : filler) {
      c += `BT 0.2 0.26 0.32 rg /F2 11 Tf 50 ${y} Td (${esc(line)}) Tj ET\n`;
      y -= 19;
    }
    if (p === 0) {
      y -= 14;
      for (const line of filler) {
        c += `BT 0.45 0.5 0.55 rg /F2 9 Tf 50 ${y} Td (${esc(line)}) Tj ET\n`;
        y -= 14;
      }
    }
    c += `BT 0.45 0.5 0.55 rg /F2 9 Tf 50 40 Td (${esc(`SAMPLE DOCUMENT  |  Page ${p + 1} of ${pages}`)}) Tj ET\n`;
    const contentId = add(`<< /Length ${Buffer.byteLength(c, "latin1")} >>\nstream\n${c}endstream`);
    kids.push(
      add(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${bold} 0 R /F2 ${regular} 0 R >> >> /Contents ${contentId} 0 R >>`,
      ),
    );
  }

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

function writePdf(file: string, title: string, lines: string[], pages = 1) {
  mkdirSync(SEED_DIR, { recursive: true });
  const full = path.join(SEED_DIR, file);
  writeFileSync(full, makePdf(title, lines, pages));
  return { url: `/uploads/seed/${file}`, name: file, size: statSync(full).size };
}

// --- seed --------------------------------------------------------------------

async function main() {
  const existing = await prisma.announcement.count();
  if (existing > 0 && !process.env.SEED_FORCE) {
    console.log("Database already has content — skipping seed. Run with SEED_FORCE=1 to wipe and re-seed.");
    return;
  }

  await prisma.submission.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.news.deleteMany();
  await prisma.member.deleteMany();
  await prisma.document.deleteMany();
  await prisma.service.deleteMany();
  await prisma.pageContent.deleteMany();
  await prisma.islandStat.deleteMany();
  await prisma.facility.deleteMany();

  // Admin account (never overwrites an existing password)
  const username = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Dhonfanu@2026";
  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin) {
    await prisma.adminUser.create({
      data: { username, name: "Council Administrator", passwordHash: await bcrypt.hash(password, 12) },
    });
    console.log(`Admin user "${username}" created.`);
  }

  // Site settings
  const site = {
    councilNameEn: "Dhonfanu Council",
    councilNameDv: "ދޮންފަނު ކައުންސިލް",
    taglineEn:
      "The Secretariat of the Dhonfanu Council, South Maalhosmadulu, serves the people of B. Dhonfanu with open, accessible local government.",
    taglineDv: "މާޅޮސްމަޑުލު ދެކުނުބުރީ ދޮންފަނު ކައުންސިލްގެ އިދާރާއިން ބ. ދޮންފަނުގެ ރައްޔިތުންނަށް ހާމަކަން ބޮޑު، ފަސޭހަ ޚިދުމަތެއް ފޯރުކޮށްދެމެވެ.",
    logoUrl: "",
    heroImageUrl: "",
    heroTitleEn: "Serving the people of Dhonfanu",
    heroTitleDv: "ދޮންފަނުގެ ރައްޔިތުންގެ ޚިދުމަތުގައި",
    heroSubtitleEn: "The official portal of Dhonfanu Council — announcements, services and island information in one place.",
    heroSubtitleDv: "ދޮންފަނު ކައުންސިލްގެ ރަސްމީ ޕޯޓަލް — އިޢުލާންތަކާއި، ޚިދުމަތްތަކާއި، ރަށުގެ މަޢުލޫމާތު އެއްތަނަކުން.",
    tickerEnabled: true,
    tickerEn:
      "Waste collection moves to Saturday morning this week because of the public holiday | The council counter closes at 13:30 on Thursday for the monthly staff meeting | Bids for the harbour-front waiting shelter close soon — see Announcements",
    tickerDv:
      "ރަސްމީ ބަންދު ދުވަހާ ގުޅިގެން މި ހަފްތާގައި ކުނި ނަގާނީ ހޮނިހިރު ދުވަހުގެ ހެނދުނު | މުވައްޒަފުންގެ މަހު ބައްދަލުވުމާ ގުޅިގެން ބުރާސްފަތި ދުވަހު ކައުންސިލްގެ ކައުންޓަރު 13:30 ގައި ބަންދުކުރެވޭނެ | ބަނދަރު ސަރަޙައްދުގެ ހިޔާވަހިކަން އެޅުމުގެ ބީލަން ހުށަހެޅުމުގެ ސުންގަޑި ކައިރިވެއްޖެ — އިޢުލާންތައް ބައްލަވާ",
    hotline: "+960 790 0100",
    phone: "+960 660 0100",
    viber: "+960 790 0100",
    email: "info@dhonfanu.gov.mv",
    officeHoursEn: "Sunday – Thursday, 08:00 – 14:00",
    officeHoursDv: "އާދީއްތަ – ބުރާސްފަތި، 08:00 – 14:00",
    addressEn: "Secretariat of the Dhonfanu Council, B. Dhonfanu, Republic of Maldives",
    addressDv: "ދޮންފަނު ކައުންސިލްގެ އިދާރާ، ބ. ދޮންފަނު، ދިވެހިރާއްޖެ",
    mapLat: 5.1853,
    mapLng: 73.126,
    mapZoom: 16,
    facebookUrl: "https://www.facebook.com/",
    twitterUrl: "https://x.com/",
    instagramUrl: "https://www.instagram.com/",
    youtubeUrl: "",
    footerNoteEn: "",
    footerNoteDv: "",
  };
  await prisma.siteConfig.upsert({ where: { id: 1 }, update: site, create: { id: 1, ...site } });

  // Page texts
  await prisma.pageContent.createMany({
    data: [
      {
        key: "about.intro",
        titleEn: "A small island with a big ocean backyard",
        titleDv: "ބޮޑު ކަނޑެއްގެ ތެރޭގައިވާ ކުޑަ ރަށެއް",
        bodyEn:
          "Dhonfanu is one of the thirteen inhabited islands of Baa Atoll (South Maalhosmadulu) in the Republic of Maldives. It is a compact, green island with a close-knit community, a sheltered harbour and a long tradition of fishing and craftsmanship.\n\nThe whole of Baa Atoll was declared a UNESCO Biosphere Reserve in 2011, and Dhonfanu is one of the inhabited islands closest to its best-known site, Hanifaru Bay. Today the island's economy combines fishing, work in nearby resorts, guesthouse tourism and small local businesses.",
        bodyDv:
          "ދޮންފަނަކީ ދިވެހިރާއްޖޭގެ މާޅޮސްމަޑުލު ދެކުނުބުރީގެ (ބ. އަތޮޅުގެ) މީހުން ދިރިއުޅޭ ތޭރަ ރަށުގެ ތެރެއިން އެއް ރަށެވެ. މިއީ ގަސްގަހާގެހިން ފެހިވެފައިވާ، އެކުވެރި މުޖުތަމަޢެއް އޮތް، ރައްކާތެރި ބަނދަރެއް ލިބިފައިވާ ކުޑަ ރަށެކެވެ. މަސްވެރިކަމާއި އަތްތެރި މަސައްކަތަކީ މި ރަށުގެ ދިގު ތާރީޚެއް އޮތް ކަންކަމެވެ.\n\nމުޅި ބ. އަތޮޅު 2011 ވަނަ އަހަރު ޔުނެސްކޯގެ ބަޔޮސްފިއަރ ރިޒާރވްއެއްގެ ގޮތުގައި ކަނޑައެޅިފައިވެއެވެ. އެ ރިޒާރވްގެ އެންމެ މަޝްހޫރު ސަރަޙައްދު ކަމަށްވާ ހަނިފަރާ އެންމެ ކައިރީގައި އޮންނަ މީހުން ދިރިއުޅޭ ރަށްތަކުގެ ތެރޭގައި ދޮންފަނު ހިމެނެއެވެ. މިއަދު ރަށުގެ އިޤްތިޞާދު ބިނާވެފައިވަނީ މަސްވެރިކަމާއި، ކައިރި ރިސޯޓުތަކުގެ ވަޒީފާތަކާއި، ގެސްޓްހައުސް ފަތުރުވެރިކަމާއި ކުދި ވިޔަފާރިތަކުގެ މައްޗަށެވެ.",
      },
      {
        key: "about.history",
        titleEn: "Community and livelihood",
        titleDv: "މުޖުތަމަޢާއި އާމްދަނީ",
        bodyEn:
          "Life on Dhonfanu follows the rhythm of the sea. Generations of islanders have worked as fishermen and boat crew, and the island is known in the atoll for its skilled craftspeople.\n\nThe council works with the Women's Development Committee, the school, the health centre and island NGOs to keep the island clean, safe and welcoming — from weekly waste collection and harbour upkeep to community events on national days.",
        bodyDv:
          "ދޮންފަނުގެ ދިރިއުޅުން ބިނާވެފައިވަނީ ކަނޑާ ގުޅިގެންނެވެ. ޖީލުތަކެއް ވަންދެން މި ރަށުގެ ރައްޔިތުން މަސްވެރިންގެ ގޮތުގައާއި އުޅަނދުފަހަރުގެ ފަޅުވެރިންގެ ގޮތުގައި މަސައްކަތްކޮށްފައިވެއެވެ. އަދި އަތްތެރި މަސައްކަތުގެ ހުނަރުވެރިންނަށް މި ރަށް އަތޮޅުގައި މަޝްހޫރެވެ.\n\nރަށް ސާފުތާހިރު، ރައްކާތެރި، މެހެމާންދާރީ ރަށެއްގެ ގޮތުގައި ދެމެހެއްޓުމަށް ކައުންސިލުން، އަންހެނުންގެ ތަރައްޤީއަށް މަސައްކަތްކުރާ ކޮމިޓީއާއި، ސްކޫލާއި، ޞިއްޙީ މަރުކަޒާއި، ރަށުގެ ޖަމްޢިއްޔާތަކާ ގުޅިގެން މަސައްކަތްކުރެއެވެ. އޭގެ ތެރޭގައި ހަފްތާއަކު އެއްފަހަރު ކުނި ނެގުމާއި، ބަނދަރު މަރާމާތުކުރުމާއި، ޤައުމީ ދުވަސްތަކުގައި ބާއްވާ ޙަރަކާތްތައް ހިމެނެއެވެ.",
      },
      {
        key: "about.hanifaru",
        titleEn: "Next door to Hanifaru Bay",
        titleDv: "ހަނިފަރާ ކައިރީގައި",
        bodyEn:
          "Hanifaru Bay, a short boat ride from Dhonfanu, is a core protected area of the Baa Atoll UNESCO Biosphere Reserve. During the south-west monsoon, roughly May to November, plankton gathers in the bay and attracts large groups of manta rays and whale sharks.\n\nVisits are regulated: snorkelling only, with licensed guides and limited visitor numbers. Dhonfanu Council supports local guides and boat operators and works with the Biosphere Reserve Office to protect the bay for future generations.",
        bodyDv:
          "ދޮންފަނާ ވަރަށް ކައިރީގައި އޮންނަ ހަނިފަރަކީ ބ. އަތޮޅު ޔުނެސްކޯ ބަޔޮސްފިއަރ ރިޒާރވްގެ ޚާއްޞަކޮށް ޙިމާޔަތްކުރެވިފައިވާ ސަރަޙައްދެކެވެ. ހުޅަނގު މޫސުމުގައި، އެބަހީ މޭ މަހުން ނޮވެންބަރު މަހާ ހަމައަށް، މި ސަރަޙައްދަށް ޕްލޭންކްޓަން ޖަމާވެ، ގިނަ އަދަދެއްގެ އެންމަޑިއާއި ފެހުރިހި އާދެއެވެ.\n\nހަނިފަރަށް ޒިޔާރަތްކުރުން ހިނގަނީ ޤަވާޢިދުތަކެއްގެ ދަށުންނެވެ. ހުއްދަ އޮތް ގައިޑުންނާއެކު ސްނޯކެލްކުރުން އެކަނި ހުއްދަވާއިރު، ޒިޔާރަތްކުރެވޭ މީހުންގެ އަދަދުވެސް ހިފެހެއްޓިފައިވެއެވެ. ދޮންފަނު ކައުންސިލުން ރަށުގެ ގައިޑުންނާއި އުޅަނދު ދުއްވާ ފަރާތްތަކަށް އެހީތެރިވެދީ، އަންނަން އޮތް ޖީލުތަކަށްޓަކައި މި ސަރަޙައްދު ރައްކާތެރިކުރުމަށް ބަޔޮސްފިއަރ ރިޒާރވް އޮފީހާ ގުޅިގެން މަސައްކަތްކުރެއެވެ.",
      },
      {
        key: "council.mission",
        titleEn: "Mission",
        titleDv: "މިޝަން",
        bodyEn:
          "To deliver fair, transparent and responsive municipal services, and to manage the island's land, environment and resources responsibly for the benefit of every resident of Dhonfanu.",
        bodyDv:
          "ހަމަހަމަ، ހާމަކަން ބޮޑު، އަވަސް ޚިދުމަތްތަކެއް ރައްޔިތުންނަށް ފޯރުކޮށްދިނުމާއި، ރަށުގެ ބިމާއި ތިމާވެށްޓާއި ވަސީލަތްތައް ދޮންފަނުގެ ކޮންމެ ރައްޔިތެއްގެ ފައިދާއަށްޓަކައި ޒިންމާދާރު ގޮތެއްގައި ބެލެހެއްޓުން.",
      },
      {
        key: "council.vision",
        titleEn: "Vision",
        titleDv: "ތަޞައްވުރު",
        bodyEn: "A clean, resilient and prosperous island community that lives in harmony with the Baa Atoll Biosphere Reserve.",
        bodyDv: "ބ. އަތޮޅު ބަޔޮސްފިއަރ ރިޒާރވްއާ އެއްގޮތަށް ދިރިއުޅޭ، ސާފުތާހިރު، ތަރައްޤީވެފައިވާ، ދެމެހެއްޓެނިވި މުޖުތަމަޢެއް.",
      },
      {
        key: "services.intro",
        titleEn: "",
        titleDv: "",
        bodyEn:
          "Start a request online and the council will follow up by phone or email. Forms can also be downloaded, filled in and handed in at the council counter during office hours.",
        bodyDv:
          "އޮންލައިންކޮށް ރިކުއެސްޓެއް ފޮނުއްވުމުން ކައުންސިލުން ފޯނުން ނުވަތަ އީމެއިލުން ގުޅާނެއެވެ. ފޯމުތައް ޑައުންލޯޑްކޮށް، ފުރިހަމަކުރުމަށްފަހު ރަސްމީ ގަޑީގައި ކައުންސިލްގެ ކައުންޓަރަށް ހުށަހެޅިދާނެއެވެ.",
      },
    ],
  });

  // Island statistics (placeholder estimates — confirm with the council)
  await prisma.islandStat.createMany({
    data: [
      { order: 1, icon: "Users", value: "512", labelEn: "Registered population", labelDv: "ރަޖިސްޓަރީ އާބާދީ", unitEn: "", unitDv: "" },
      { order: 2, icon: "House", value: "96", labelEn: "Households", labelDv: "ގޭބިސީ", unitEn: "", unitDv: "" },
      { order: 3, icon: "Ruler", value: "13.2", labelEn: "Land area", labelDv: "ބިމުގެ ބޮޑުމިން", unitEn: "ha", unitDv: "ހެކްޓަރު" },
      { order: 4, icon: "Fish", value: "≈ 1.5", labelEn: "Distance to Hanifaru Bay", labelDv: "ހަނިފަރާ ހުރި ދުރުމިން", unitEn: "km", unitDv: "ކިލޯމީޓަރު" },
      { order: 5, icon: "Plane", value: "≈ 6", labelEn: "To Dharavandhoo Airport", labelDv: "ދަރަވަންދޫ އެއަރޕޯޓާ ހުރި ދުރުމިން", unitEn: "km", unitDv: "ކިލޯމީޓަރު" },
      { order: 6, icon: "Navigation", value: "≈ 120", labelEn: "Distance from Malé", labelDv: "މާލެއާ ހުރި ދުރުމިން", unitEn: "km", unitDv: "ކިލޯމީޓަރު" },
      { order: 7, icon: "Globe", value: "2011", labelEn: "Biosphere Reserve since", labelDv: "ބަޔޮސްފިއަރ ރިޒާރވްއަކަށް ކަނޑައެޅުނު އަހަރު", unitEn: "", unitDv: "" },
      { order: 8, icon: "Ship", value: "14", labelEn: "Registered vessels", labelDv: "ރަޖިސްޓަރީ އުޅަނދު", unitEn: "", unitDv: "" },
    ],
  });

  // Facilities directory
  await prisma.facility.createMany({
    data: [
      { order: 1, icon: "Landmark", phone: "+960 660 0100", nameEn: "Council Secretariat", nameDv: "ކައުންސިލްގެ އިދާރާ", descriptionEn: "Public counter, permits and registrations", descriptionDv: "ޢާންމު ކައުންޓަރު، ހުއްދަތަކާއި ރަޖިސްޓްރީ" },
      { order: 2, icon: "School", phone: "+960 660 0110", nameEn: "Dhonfanu School", nameDv: "ދޮންފަނު ސްކޫލް", descriptionEn: "Primary and lower-secondary education", descriptionDv: "ފަށާ ތަޢުލީމާއި މެދުމަދްރަސީ ތަޢުލީމު" },
      { order: 3, icon: "HeartPulse", phone: "+960 660 0120", nameEn: "Health Centre", nameDv: "ޞިއްޙީ މަރުކަޒު", descriptionEn: "Outpatient care and 24-hour emergency response", descriptionDv: "އޯ.ޕީ.ޑީ ޚިދުމަތާއި 24 ގަޑިއިރުގެ އެމަރޖެންސީ ޚިދުމަތް" },
      { order: 4, icon: "Anchor", phone: "", nameEn: "Harbour & Ferry Terminal", nameDv: "ބަނދަރާއި ފެރީ ޓާރމިނަލް", descriptionEn: "Atoll ferry, cargo and visiting vessels", descriptionDv: "އަތޮޅު ފެރީއާއި، މުދާ އަރުވާ ބޭލުމާއި، އުޅަނދުފަހަރު" },
      { order: 5, icon: "Zap", phone: "+960 660 0130", nameEn: "Powerhouse (Fenaka)", nameDv: "އިންޖީނުގެ (ފެނަކަ)", descriptionEn: "Electricity and water services", descriptionDv: "ކަރަންޓާއި ފެނުގެ ޚިދުމަތް" },
      { order: 6, icon: "Recycle", phone: "", nameEn: "Waste Management Centre", nameDv: "ކުނި މެނޭޖްކުރާ މަރުކަޒު", descriptionEn: "Sorting, composting and weekly collection", descriptionDv: "ކުނި ވަކިކުރުމާއި، ކާދު ހެދުމާއި، ހަފްތާއަކު އެއްފަހަރު ކުނި ނެގުން" },
      { order: 7, icon: "Building2", phone: "", nameEn: "Friday Mosque", nameDv: "ހުކުރު މިސްކިތް", descriptionEn: "The island's main mosque", descriptionDv: "ރަށުގެ މައި މިސްކިތް" },
      { order: 8, icon: "Scale", phone: "+960 660 0140", nameEn: "Magistrate Court", nameDv: "މެޖިސްޓްރޭޓް ކޯޓު", descriptionEn: "Dhonfanu Magistrate Court", descriptionDv: "ދޮންފަނު މެޖިސްޓްރޭޓް ކޯޓު" },
      { order: 9, icon: "Trophy", phone: "", nameEn: "Football Ground & Futsal Court", nameDv: "ފުޓްބޯޅަ ދަނޑާއި ފުޓްސަލް ދަނޑު", descriptionEn: "Sports and community events", descriptionDv: "ކުޅިވަރާއި މުޖުތަމަޢުގެ ޙަރަކާތްތައް" },
    ],
  });

  // E-Services
  await prisma.service.createMany({
    data: [
      {
        order: 1, icon: "FileSearch", featured: true, linkUrl: "",
        titleEn: "Request for Information", titleDv: "މަޢުލޫމާތު ހޯދުމަށް އެދުން",
        descriptionEn: "Ask for council records under the Right to Information Act. Replies are issued within the legal time frame.",
        descriptionDv: "މަޢުލޫމާތު ހޯދައި ލިބިގަތުމުގެ ޙައްޤުގެ ޤާނޫނުގެ ދަށުން ކައުންސިލްގެ ރެކޯޑުތަކަށް އެދި ހުށަހެޅުއްވުން. ޤާނޫނުގައިވާ މުއްދަތުގެ ތެރޭގައި ޖަވާބު ދެވޭނެ.",
      },
      {
        order: 2, icon: "ClipboardCheck", featured: true, linkUrl: "",
        titleEn: "Permits & Registrations", titleDv: "ހުއްދަތަކާއި ރަޖިސްޓްރީ",
        descriptionEn: "Event permits, vendor stalls, and vehicle and vessel registration.",
        descriptionDv: "ޙަރަކާތްތަކުގެ ހުއްދައާއި، ވިޔަފާރި ސްޓޯލްތަކާއި، ވެހިކަލާއި އުޅަނދު ރަޖިސްޓްރީކުރުން.",
      },
      {
        order: 3, icon: "Recycle", featured: true, linkUrl: "",
        titleEn: "Waste Collection", titleDv: "ކުނި ނެގުމުގެ ޚިދުމަތް",
        descriptionEn: "Register a household or business for weekly collection, or request a bulk pick-up.",
        descriptionDv: "ހަފްތާއަކު އެއްފަހަރު ކުނި ނެގުމަށް ގެއެއް ނުވަތަ ވިޔަފާރިއެއް ރަޖިސްޓްރީކުރުމާއި، ބޮޑެތި ތަކެތި ނެގުމަށް އެދުން.",
      },
      {
        order: 4, icon: "MapPinned", featured: true, linkUrl: "",
        titleEn: "Land & Housing", titleDv: "ބިމާއި ގެދޮރު",
        descriptionEn: "Plot registration, boundary letters and building permit applications.",
        descriptionDv: "ގޯތި ރަޖިސްޓްރީކުރުމާއި، އިންފާރުގެ ލިޔުންތަކާއި، ޢިމާރާތްކުރުމުގެ ހުއްދައަށް އެދުން.",
      },
      {
        order: 5, icon: "CalendarDays", featured: true, linkUrl: "",
        titleEn: "Venue Booking", titleDv: "ތަންތަން ބުކްކުރުން",
        descriptionEn: "Book the community hall or the futsal court for events.",
        descriptionDv: "ޙަރަކާތްތަކަށް ރަށުގެ ހޯލު ނުވަތަ ފުޓްސަލް ދަނޑު ބުކްކުރުން.",
      },
      {
        order: 6, icon: "MessageSquareWarning", featured: true, linkUrl: "/contact?type=COMPLAINT",
        titleEn: "Report a Problem", titleDv: "މައްސަލައެއް ރިޕޯޓްކުރުން",
        descriptionEn: "Street lights, roads, the harbour, noise or any other issue the council should know about.",
        descriptionDv: "މަގުބައްތި، މަގުތައް، ބަނދަރު، އަޑުގަދަކުރުން ނުވަތަ ކައުންސިލަށް އަންގަން ބޭނުންވާ އެހެން މައްސަލައެއް.",
      },
      {
        order: 7, icon: "Stamp", featured: false, linkUrl: "",
        titleEn: "Certificates & Letters", titleDv: "ސެޓްފިކެޓާއި ލިޔުންތައް",
        descriptionEn: "Residency confirmation, registry extracts and other official letters.",
        descriptionDv: "ދިރިއުޅޭކަމުގެ ލިޔުމާއި، ރަޖިސްޓްރީގެ ކޮޕީއާއި އެހެނިހެން ރަސްމީ ލިޔުންތައް.",
      },
      {
        order: 8, icon: "FileText", featured: false, linkUrl: "/downloads?category=FORM",
        titleEn: "Download Forms", titleDv: "ފޯމުތައް ޑައުންލޯޑްކުރުން",
        descriptionEn: "All council application forms in one place.",
        descriptionDv: "ކައުންސިލްގެ ހުރިހާ ފޯމުތައް އެއްތަނަކުން.",
      },
    ],
  });

  // Council, WDC and secretariat (placeholder names)
  const term = "2026 – 2031";
  await prisma.member.createMany({
    data: [
      { group: "COUNCIL", order: 1, term, nameEn: "Ahmed Shifaz", nameDv: "އަޙްމަދު ޝިފާޒް", roleEn: "Council President", roleDv: "ކައުންސިލްގެ ރައީސް", phone: "+960 790 0101", email: "president@dhonfanu.gov.mv" },
      { group: "COUNCIL", order: 2, term, nameEn: "Ibrahim Nazeer", nameDv: "އިބްރާހީމް ނަޒީރު", roleEn: "Council Vice President", roleDv: "ކައުންސިލްގެ ނައިބު ރައީސް" },
      { group: "COUNCIL", order: 3, term, nameEn: "Aminath Shaheema", nameDv: "އާމިނަތު ޝަހީމާ", roleEn: "Council Member", roleDv: "ކައުންސިލްގެ މެންބަރު" },
      { group: "WDC", order: 1, term, nameEn: "Fathimath Zuhura", nameDv: "ފާޠިމަތު ޒުހުރާ", roleEn: "WDC President", roleDv: "ކޮމިޓީގެ ރައީސާ" },
      { group: "WDC", order: 2, term, nameEn: "Mariyam Nisha", nameDv: "މަރްޔަމް ނިޝާ", roleEn: "WDC Vice President", roleDv: "ކޮމިޓީގެ ނައިބު ރައީސާ" },
      { group: "WDC", order: 3, term, nameEn: "Aishath Leena", nameDv: "ޢާއިޝަތު ލީނާ", roleEn: "WDC Member", roleDv: "ކޮމިޓީގެ މެންބަރު" },
      { group: "WDC", order: 4, term, nameEn: "Hawwa Shimla", nameDv: "ޙައްވާ ޝިމްލާ", roleEn: "WDC Member", roleDv: "ކޮމިޓީގެ މެންބަރު" },
      { group: "WDC", order: 5, term, nameEn: "Khadheeja Rasheeda", nameDv: "ޚަދީޖާ ރަޝީދާ", roleEn: "WDC Member", roleDv: "ކޮމިޓީގެ މެންބަރު" },
      { group: "ADMIN", order: 1, term: "", nameEn: "Hussain Fayaz", nameDv: "ޙުސައިން ފައްޔާޒު", roleEn: "Secretary General", roleDv: "ސެކްރެޓަރީ ޖެނެރަލް", email: "sg@dhonfanu.gov.mv" },
      { group: "ADMIN", order: 2, term: "", nameEn: "Aminath Suma", nameDv: "އާމިނަތު ސުމާ", roleEn: "Assistant Director", roleDv: "އެސިސްޓަންޓް ޑިރެކްޓަރ" },
      { group: "ADMIN", order: 3, term: "", nameEn: "Yoosuf Naaif", nameDv: "ޔޫސުފް ނާއިފް", roleEn: "Finance Officer", roleDv: "ފައިނޭންސް އޮފިސަރ" },
      { group: "ADMIN", order: 4, term: "", nameEn: "Shazna Ibrahim", nameDv: "ޝަޒްނާ އިބްރާހީމް", roleEn: "Administrative Officer", roleDv: "އެޑްމިނިސްޓްރޭޓިވް އޮފިސަރ" },
    ],
  });

  // Announcements, tenders and vacancies
  const ref = (n: number) => `(IUL)DC/${YEAR}/${n}`;
  const announcements = [
    {
      n: 48, category: "TENDER", published: -1, deadline: 12, pdf: "Bid documents",
      titleEn: "Invitation for Bids: Construction of the Harbour-front Waiting Shelter",
      titleDv: "ބަނދަރު ސަރަޙައްދުގައި ހިޔާވަހިކަމެއް އެޅުމަށް ބީލަން ހުށަހެޅުމުގެ ދަޢުވަތު",
      contentEn:
        "Dhonfanu Council invites bids from interested parties for the construction of a passenger waiting shelter at the harbour front.\n\nA pre-bid meeting will be held at the council secretariat. Bid documents and the bill of quantities can be downloaded from this page or collected from the council counter during office hours.\n\nBids must be submitted in a sealed envelope to the council secretariat before the deadline. Late bids will not be accepted.",
      contentDv:
        "ބަނދަރު ސަރަޙައްދުގައި ފަސިންޖަރުންނަށް ހިޔާވަހިކަމެއް އެޅުމުގެ މަސައްކަތް ކުރުމަށް ޝައުޤުވެރިވާ ފަރާތްތަކަށް ބީލަން ހުށަހެޅުމުގެ ފުރުޞަތު ދޮންފަނު ކައުންސިލުން ހުޅުވާލަމެވެ.\n\nބީލަމާ ގުޅޭ މަޢުލޫމާތު ދިނުމުގެ ބައްދަލުވުމެއް ކައުންސިލްގެ އިދާރާގައި ބޭއްވޭނެއެވެ. ބީލަން ފޮތާއި ބީ.އޯ.ކިޔު މި ޞަފްޙާއިން ޑައުންލޯޑްކުރެވޭނެއެވެ. ނުވަތަ ރަސްމީ ގަޑީގައި ކައުންސިލްގެ ކައުންޓަރުން ލިބިގެންދާނެއެވެ.\n\nބީލަންތައް ހުށަހަޅަންވާނީ ބަންދުކުރެވިފައިވާ ސިޓީއުރައެއްގައި، ސުންގަޑީގެ ކުރިން ކައުންސިލްގެ އިދާރާއަށެވެ. ސުންގަޑި ފާއިތުވުމަށްފަހު ހުށަހަޅާ ބީލަންތައް ބަލައެއް ނުގަނެވޭނެއެވެ.",
    },
    {
      n: 47, category: "JOB", published: -2, deadline: 7, pdf: "Job application form",
      titleEn: "Vacancy: Assistant Council Officer",
      titleDv: "ވަޒީފާގެ ފުރުޞަތު: އެސިސްޓަންޓް ކައުންސިލް އޮފިސަރ",
      contentEn:
        "Applications are invited for the post of Assistant Council Officer at the Dhonfanu Council Secretariat.\n\nRequirements: GCE O'Level passes in Dhivehi and English, and basic computer skills. Experience in public service is an advantage.\n\nSubmit the completed job application form with copies of certificates and ID card to the council secretariat or by email before the deadline.",
      contentDv:
        "ދޮންފަނު ކައުންސިލްގެ އިދާރާގެ އެސިސްޓަންޓް ކައުންސިލް އޮފިސަރުގެ މަޤާމަށް ޝައުޤުވެރިވާ ފަރާތްތަކަށް ކުރިމަތިލުމުގެ ފުރުޞަތު ހުޅުވާލަމެވެ.\n\nޝަރުޠުތައް: ޖީ.ސީ.އީ އޯލެވެލް އިމްތިޙާނުން ދިވެހި އަދި އިނގިރޭސި މާއްދާއިން ފާސްވެފައިވުމާއި، ކޮމްޕިއުޓަރު ބޭނުންކުރަން އެނގުން. ދައުލަތުގެ އިދާރާއެއްގައި މަސައްކަތްކުރުމުގެ ތަޖުރިބާ ލިބިފައިވާ ފަރާތްތަކަށް އިސްކަން ދެވޭނެއެވެ.\n\nފުރިހަމަކޮށްފައިވާ ވަޒީފާއަށް އެދޭ ފޯމާއެކު ސެޓްފިކެޓްތަކުގެ ކޮޕީއާއި އައި.ޑީ ކާޑުގެ ކޮޕީ، ސުންގަޑީގެ ކުރިން ކައުންސިލްގެ އިދާރާއަށް ނުވަތަ އީމެއިލް މެދުވެރިކޮށް ހުށަހަޅުއްވާށެވެ.",
    },
    {
      n: 46, category: "NOTICE", published: -3, deadline: null, pdf: null,
      titleEn: "Change to this week's waste collection schedule",
      titleDv: "މި ހަފްތާގެ ކުނި ނެގުމުގެ ތާވަލަށް ގެނެވުނު ބަދަލު",
      contentEn:
        "Because of the public holiday, household waste will be collected on Saturday morning this week instead of Friday.\n\nPlease place sorted waste outside your gate before 07:00. Bulky items are collected on request through the council counter or the online form.",
      contentDv:
        "ރަސްމީ ބަންދު ދުވަހާ ގުޅިގެން މި ހަފްތާގައި ގޭބިސީތަކުން ކުނި ނަގާނީ ހުކުރު ދުވަހުގެ ބަދަލުގައި ހޮނިހިރު ދުވަހުގެ ހެނދުނުއެވެ.\n\nވަކިކޮށްފައިވާ ކުނި ހެނދުނު 07:00 ގެ ކުރިން ގޭގެ ދޮރުމަތީގައި ބަހައްޓަވާށެވެ. ބޮޑެތި ތަކެތި ނަގައިދެވޭނީ ކައުންސިލްގެ ކައުންޓަރު ނުވަތަ އޮންލައިން ފޯމު މެދުވެރިކޮށް އެދުމުންނެވެ.",
    },
    {
      n: 45, category: "TENDER", published: -5, deadline: 3, pdf: "Technical specifications",
      titleEn: "Request for Quotations: Supply of 40 LED street lights",
      titleDv: "މަގުބައްތިތަކަށް ބޭނުންވާ 40 އެލް.އީ.ޑީ ބޮކި ސަޕްލައިކޮށްދޭނެ ފަރާތެއް ހޯދުން",
      contentEn:
        "The council seeks quotations for the supply and delivery of 40 LED street light fittings (60 W, IP65) to Dhonfanu.\n\nQuotations must state the unit price, delivery period and warranty. Technical specifications are in the attached document.",
      contentDv:
        "ދޮންފަނުގެ މަގުބައްތިތަކަށް ބޭނުންވާ 40 އެލް.އީ.ޑީ ބޮކި (60 ވޮޓް، އައި.ޕީ 65) ސަޕްލައިކޮށް ރަށަށް ގެނެސްދޭނެ ފަރާތެއް ހޯދުމަށް ކައުންސިލުން އަގު ހޯދަމެވެ.\n\nއަގު ހުށަހަޅާއިރު ކޮންމެ ބޮއްކެއްގެ އަގާއި، ގެނެސްދެވޭނެ މުއްދަތާއި، ވޮރަންޓީ ބަޔާންކުރަންވާނެއެވެ. ޓެކްނިކަލް މަޢުލޫމާތު އެޓޭޗްކޮށްފައިވާ ލިޔުމުގައި ވާނެއެވެ.",
    },
    {
      n: 44, category: "NOTICE", published: -7, deadline: 5, pdf: "Meeting notice",
      titleEn: "Public consultation: draft Land Use Plan 2027–2031",
      titleDv: "ބިން ބޭނުންކުރުމުގެ ޕްލޭނު (2027–2031) ގެ ދެލިކޮޕީއާ މެދު ރައްޔިތުންގެ ޚިޔާލު ހޯދުން",
      contentEn:
        "The council will hold a public meeting at the community hall to present the draft Land Use Plan and hear residents' views.\n\nThe draft is available in Downloads. Written comments can be sent through the Contact page until the day of the meeting.",
      contentDv:
        "ބިން ބޭނުންކުރުމުގެ ޕްލޭނުގެ ދެލިކޮޕީ ހުށަހަޅައި ރައްޔިތުންގެ ޚިޔާލު ހޯދުމަށް ރަށުގެ ހޯލުގައި ޢާންމު ބައްދަލުވުމެއް ބޭއްވުމަށް ކައުންސިލުން ހަމަޖައްސާފައިވެއެވެ.\n\nޕްލޭނުގެ ދެލިކޮޕީ ޑައުންލޯޑްސް ބައިން ލިބިވަޑައިގަންނަވާނެއެވެ. ލިޔުމުން ޚިޔާލު ފޮނުއްވުމުގެ ފުރުޞަތު ބައްދަލުވުން ބާއްވާ ދުވަހާ ހަމައަށް «ގުޅުއްވުމަށް» ޞަފްޙާ މެދުވެރިކޮށް ހުޅުވާލެވިފައިވާނެއެވެ.",
    },
    {
      n: 43, category: "TENDER", published: -9, deadline: 20, pdf: "Bid documents",
      titleEn: "Invitation for Bids: Resurfacing of the futsal court",
      titleDv: "ފުޓްސަލް ދަނޑުގެ ތަޅުން އަލުން އެޅުމަށް ބީލަން ހުށަހެޅުމުގެ ދަޢުވަތު",
      contentEn:
        "Bids are invited for resurfacing the island futsal court with a synthetic sports surface and repainting the line markings. A site visit can be arranged through the council secretariat.",
      contentDv:
        "ރަށުގެ ފުޓްސަލް ދަނޑުގައި ސިންތެޓިކް ތަޅުމެއް އަޅައި، ރޮނގުތައް އަލުން ކުރެހުމުގެ މަސައްކަތަށް ބީލަން ހުށަހެޅުމުގެ ފުރުޞަތު ހުޅުވާލަމެވެ. މަސައްކަތްކުރަންޖެހޭ ތަން ބެލުމަށް ބޭނުންވާނަމަ ކައުންސިލްގެ އިދާރާ މެދުވެރިކޮށް ހަމަޖައްސައިދެވޭނެއެވެ.",
    },
    {
      n: 42, category: "NOTICE", published: -12, deadline: null, pdf: null,
      titleEn: "Hanifaru Bay season: briefing for local guides and vessel operators",
      titleDv: "ހަނިފަރު ސީޒަން: ރަށުގެ ގައިޑުންނާއި އުޅަނދު ދުއްވާ ފަރާތްތަކަށް ދެވޭ މަޢުލޫމާތު",
      contentEn:
        "Guides and boat operators based in Dhonfanu are reminded to carry valid Hanifaru Bay permits and to follow the visitor limits and time slots set by the Biosphere Reserve Office. A briefing session will be held at the council secretariat.",
      contentDv:
        "ދޮންފަނުގައި މަސައްކަތްކުރާ ގައިޑުންނާއި އުޅަނދު ދުއްވާ ފަރާތްތަކުން ހަނިފަރަށް ދިއުމުގެ ސައްޙަ ހުއްދަ ގެންގުޅުމަށާއި، ބަޔޮސްފިއަރ ރިޒާރވް އޮފީހުން ކަނޑައަޅާފައިވާ ޒިޔާރަތްކުރެވޭ މީހުންގެ އަދަދާއި ގަޑިތަކަށް ޢަމަލުކުރުމަށް ހަނދާންކޮށްދެމެވެ. މިކަމާ ގުޅޭ މަޢުލޫމާތު ދިނުމުގެ ބައްދަލުވުމެއް ކައުންސިލްގެ އިދާރާގައި ބޭއްވޭނެއެވެ.",
    },
    {
      n: 41, category: "NOTICE", published: -15, deadline: 30, pdf: null,
      titleEn: "Annual land rent and permit fees are now due",
      titleDv: "އަހަރީ ބިމުގެ ކުއްޔާއި ހުއްދަތަކުގެ ފީ ދެއްކުން",
      contentEn:
        "Tenants of council land and holders of annual business permits are requested to settle fees for the coming year at the council counter. Payments can be made in cash or by bank transfer.",
      contentDv:
        "ކައުންސިލްގެ ބިންތައް ކުއްޔަށް ހިފާފައިވާ ފަރާތްތަކާއި، އަހަރީ ވިޔަފާރީގެ ހުއްދަ ނަގާފައިވާ ފަރާތްތަކުން އަންނަ އަހަރުގެ ފީ ކައުންސިލްގެ ކައުންޓަރަށް ދެއްކެވުން އެދެމެވެ. ފައިސާ ދެއްކޭނީ ނަގުދު ފައިސާއިން ނުވަތަ ބޭންކް ޓްރާންސްފަރ މެދުވެރިކޮށެވެ.",
    },
    {
      n: 40, category: "NOTICE", published: -19, deadline: null, pdf: null,
      titleEn: "Scheduled power interruption for generator maintenance",
      titleDv: "އިންޖީނު މަރާމާތުކުރުމާ ގުޅިގެން ކަރަންޓު ކަނޑާލެވޭނެ ގަޑި",
      contentEn:
        "Fenaka has informed the council that electricity will be interrupted in the northern ward from 09:00 to 11:30 for scheduled generator maintenance. We apologise for the inconvenience.",
      contentDv:
        "އިންޖީނު މަރާމާތުކުރުމުގެ މަސައްކަތާ ގުޅިގެން ރަށުގެ އުތުރު އަވަށުން ހެނދުނު 09:00 އިން 11:30 އަށް ކަރަންޓު ކަނޑާލެވޭނެކަމަށް ފެނަކައިން ކައުންސިލަށް އަންގާފައިވެއެވެ. މިކަމުގައި ދިމާވާ ދަތިތަކަށް މަޢާފަށް އެދެމެވެ.",
    },
    {
      n: 39, category: "JOB", published: -34, deadline: -10, pdf: "Job application form",
      titleEn: "Vacancy: Waste Management Centre Operator",
      titleDv: "ވަޒީފާގެ ފުރުޞަތު: ކުނި މެނޭޖްކުރާ މަރުކަޒުގެ އޮޕަރޭޓަރު",
      contentEn:
        "Applications were invited for one Waste Management Centre Operator on a one-year contract. The application period has now ended and shortlisted candidates will be contacted for interviews.",
      contentDv:
        "ކުނި މެނޭޖްކުރާ މަރުކަޒުގެ އޮޕަރޭޓަރެއްގެ މަޤާމަށް އެއް އަހަރު ދުވަހުގެ ކޮންޓްރެކްޓެއްގެ ދަށުން މީހަކު ހޯދުމަށް ކުރި އިޢުލާނެވެ. ކުރިމަތިލުމުގެ މުއްދަތު މިހާރު ހަމަވެފައިވާއިރު، ޝަރުޠު ހަމަވާ ފަރާތްތަކަށް އިންޓަރވިއުއަށް ދެންނެވޭނެއެވެ.",
    },
    {
      n: 38, category: "TENDER", published: -45, deadline: -20, pdf: "Lease information sheet",
      titleEn: "Lease of two commercial plots near the harbour (second announcement)",
      titleDv: "ބަނދަރު ކައިރިން ވިޔަފާރި ކުރުމަށް ދެ ބިން ކުއްޔަށް ދޫކުރުން (ދެވަނަ އިޢުލާން)",
      contentEn:
        "The council re-announced the lease of two plots (600 sq ft each) near the harbour for retail or café use. Proposals were evaluated on rent offered, business plan and local employment.",
      contentDv:
        "ފިހާރަ ނުވަތަ ކެފޭ ހިންގުމަށް ބަނދަރު ކައިރިން ދެ ބިން (ކޮންމެ ބިމަކީ 600 އަކަފޫޓު) ކުއްޔަށް ދޫކުރުމަށް ކައުންސިލުން ދެވަނަ ފަހަރަށް ކުރި އިޢުލާނެވެ. ހުށަހެޅުންތައް ބެލިފައިވަނީ ހުށަހަޅާ ކުއްޔާއި، ވިޔަފާރީގެ ޕްލޭނާއި، ރަށުގެ މީހުންނަށް ލިބޭނެ ވަޒީފާގެ ފުރުޞަތުތަކަށް ބަލައިގެންނެވެ.",
    },
    {
      n: 37, category: "NOTICE", published: -52, deadline: null, pdf: null,
      titleEn: "Registration open for the community composting programme",
      titleDv: "މުޖުތަމަޢުގެ ކާދު ހެދުމުގެ ޕްރޮގްރާމުގައި ބައިވެރިވުމަށް ރަޖިސްޓްރީވުން ހުޅުވާލައިފި",
      contentEn:
        "Households that wish to receive a compost bin and take part in the composting programme run with the Women's Development Committee can register at the council counter or through the online form.",
      contentDv:
        "އަންހެނުންގެ ތަރައްޤީއަށް މަސައްކަތްކުރާ ކޮމިޓީއާ ގުޅިގެން ހިންގާ ކާދު ހެދުމުގެ ޕްރޮގްރާމުގައި ބައިވެރިވެ، ކާދު ހަދާ ވަށިގަނޑެއް ހޯދުމަށް ބޭނުންވާ ގޭބިސީތަކަށް ކައުންސިލްގެ ކައުންޓަރުން ނުވަތަ އޮންލައިން ފޯމު މެދުވެރިކޮށް ރަޖިސްޓްރީވެވޭނެއެވެ.",
    },
  ];

  for (const a of announcements) {
    const file = a.pdf
      ? writePdf(`announcement-${a.n}.pdf`, a.titleEn.slice(0, 62), [`Reference: ${ref(a.n)}`, `Document: ${a.pdf}`, "", ...a.contentEn.split("\n\n")[0].match(/.{1,88}(\s|$)/g)!.map((s) => s.trim())])
      : null;
    await prisma.announcement.create({
      data: {
        refNumber: ref(a.n),
        category: a.category,
        titleEn: a.titleEn,
        titleDv: a.titleDv,
        contentEn: a.contentEn,
        contentDv: a.contentDv,
        publishDate: daysFromNow(a.published, 9),
        deadline: a.deadline === null ? null : daysFromNow(a.deadline, 14),
        attachmentUrl: file?.url ?? "",
        attachmentName: file ? `${a.pdf}.pdf` : "",
        attachmentSize: file?.size ?? 0,
      },
    });
  }

  // News
  await prisma.news.createMany({
    data: [
      {
        slug: "harbour-waiting-shelter-bidding-opens", category: "DEVELOPMENT", featured: true, published: true,
        imageUrl: "/images/harbor.svg", publishedAt: daysFromNow(-2, 10),
        titleEn: "Council opens bidding for harbour-front waiting shelter",
        titleDv: "ބަނދަރު ސަރަޙައްދުގައި ހިޔާވަހިކަމެއް އެޅުމުގެ ބީލަން ހުޅުވާލައިފި",
        excerptEn: "A covered waiting area with seating and lighting is planned for ferry passengers at the harbour front.",
        excerptDv: "ފެރީގައި ދަތުރުކުރާ ފަރާތްތަކަށް ބަނދަރު ސަރަޙައްދުގައި ގޮނޑިއާއި ބައްތި ހުންނަ ހިޔާވަހިކަމެއް އެޅުމަށް ވަނީ ރާވާފައި.",
        contentEn:
          "<p>Dhonfanu Council has opened bidding for the construction of a passenger waiting shelter at the harbour front, one of the projects prioritised by residents during this year's budget consultation.</p><p>The shelter will provide shaded seating, lighting and a notice board for ferry schedules. The council said the project responds to a long-standing request from students, elderly residents and commuters who use the atoll ferry.</p><h2>What happens next</h2><ul><li>Bid documents are available from the Announcements page.</li><li>A pre-bid meeting will be held at the council secretariat.</li><li>Construction is expected to take around three months after the contract is awarded.</li></ul>",
        contentDv:
          "<p>ބަނދަރު ސަރަޙައްދުގައި ފަސިންޖަރުންނަށް ހިޔާވަހިކަމެއް އެޅުމުގެ މަސައްކަތަށް ދޮންފަނު ކައުންސިލުން ބީލަން ހުޅުވާލައިފިއެވެ. މިއީ މި އަހަރުގެ ބަޖެޓާ ގުޅޭ ގޮތުން ރައްޔިތުންގެ ޚިޔާލު ހޯދުމުގައި އެންމެ އިސްކަންދޭން ފާހަގަކުރެވުނު އެއް މަޝްރޫޢެވެ.</p><p>މި ތަނުގައި ހިޔާ ލިބޭ ގޮނޑިތަކާއި، ބައްތިއާއި، ފެރީ ތާވަލު ބެހެއްޓޭނެ ނޯޓިސް ބޯޑެއް ހުންނާނެއެވެ. ކައުންސިލުން ބުނީ، މިއީ އަތޮޅު ފެރީ ބޭނުންކުރާ ދަރިވަރުންނާއި، ދުވަސްވީ މީހުންނާއި، ދަތުރުވެރިން ގިނަ ދުވަހު ވަންދެން އެދެމުން އައި ކަމެއް ކަމަށެވެ.</p><h2>ކުރިއަށް އޮތް ކަންތައްތައް</h2><ul><li>ބީލަން ފޮތް އިޢުލާންތަކުގެ ޞަފްޙާއިން ލިބޭނެއެވެ.</li><li>ބީލަމާ ގުޅޭ މަޢުލޫމާތު ދިނުމުގެ ބައްދަލުވުމެއް ކައުންސިލްގެ އިދާރާގައި ބޭއްވޭނެއެވެ.</li><li>މަސައްކަތް ޙަވާލުކުރާތާ ގާތްގަނޑަކަށް ތިން މަސްދުވަހުން މަސައްކަތް ނިންމޭނެ ކަމަށް ލަފާކުރެވެއެވެ.</li></ul>",
      },
      {
        slug: "island-wide-beach-clean-up", category: "COMMUNITY", featured: false, published: true,
        imageUrl: "/images/beach.svg", publishedAt: daysFromNow(-6, 10),
        titleEn: "More than 120 volunteers join island-wide beach clean-up",
        titleDv: "ރަށުގެ ގޮނޑުދޮށް ސާފުކުރުމުގެ ޙަރަކާތުގައި 120 އަށްވުރެ ގިނަ މީހުން ބައިވެރިވެއްޖެ",
        excerptEn: "Students, the WDC, NGOs and council staff collected over 600 kg of waste from the beach and harbour area.",
        excerptDv: "ދަރިވަރުންނާއި، ކޮމިޓީގެ މެންބަރުންނާއި، ޖަމްޢިއްޔާތަކާއި ކައުންސިލްގެ މުވައްޒަފުން ގުޅިގެން ގޮނޑުދޮށާއި ބަނދަރު ސަރަޙައްދުން 600 ކިލޯއަށްވުރެ ގިނަ ކުނި ނަގައިފި.",
        contentEn:
          "<p>More than 120 residents took part in an island-wide clean-up organised by the council and the Women's Development Committee on Saturday morning.</p><p>Volunteers worked in teams along the beach, the harbour and the island's main roads. Over 600 kg of waste was collected, sorted and taken to the Waste Management Centre, where plastics and metals were separated for recycling.</p><blockquote>Keeping Dhonfanu clean is everyone's work, and it was encouraging to see so many young people take part.</blockquote><p>The council thanks every volunteer and the local businesses that donated refreshments and gloves. The next clean-up is planned for the start of the new school term.</p>",
        contentDv:
          "<p>ކައުންސިލާއި އަންހެނުންގެ ތަރައްޤީއަށް މަސައްކަތްކުރާ ކޮމިޓީ ގުޅިގެން ހޮނިހިރު ދުވަހުގެ ހެނދުނު ބޭއްވި ރަށު ފެންވަރުގެ ސާފުކުރުމުގެ ޙަރަކާތުގައި 120 އަށްވުރެ ގިނަ ރައްޔިތުން ބައިވެރިވެއްޖެއެވެ.</p><p>ބައިވެރިން ޓީމުތަކަކަށް ބެހިގެން ގޮނޑުދޮށާއި، ބަނދަރާއި، ރަށުގެ މައި މަގުތައް ސާފުކުރިއެވެ. މި ޙަރަކާތުގައި 600 ކިލޯއަށްވުރެ ގިނަ ކުނި ނަގައި، ވަކިކޮށް، ކުނި މެނޭޖްކުރާ މަރުކަޒަށް ގެންދެވުނެވެ. އެތަނުގައި ޕްލާސްޓިކާއި ދަގަނޑުގެ ބާވަތްތައް ރީސައިކަލްކުރުމަށް ވަކިކުރެވުނެވެ.</p><blockquote>ދޮންފަނު ސާފުތާހިރުކޮށް ބެހެއްޓުމަކީ އެންމެންގެ މަސައްކަތެކެވެ. މިހާ ގިނަ ޒުވާނުން ބައިވެރިވިކަމީ ވަރަށް އުފާވެރި ކަމެކެވެ.</blockquote><p>ބައިވެރިވި ހުރިހާ ފަރާތްތަކަށާއި، ބުއިމާއި އަންގި ހަދިޔާކުރި ވިޔަފާރިތަކަށް ކައުންސިލުން ޝުކުރު ދަންނަވައެވެ. ދެން އޮތް ސާފުކުރުމުގެ ޙަރަކާތް ބާއްވަން ރާވާފައިވަނީ ސްކޫލުގެ އައު ޓާރމް ފެށޭ ދުވަސްވަރުއެވެ.</p>",
      },
      {
        slug: "students-complete-reef-awareness-programme", category: "ENVIRONMENT", featured: false, published: true,
        imageUrl: "/images/aerial.svg", publishedAt: daysFromNow(-11, 10),
        titleEn: "Dhonfanu School students complete reef awareness programme",
        titleDv: "ދޮންފަނު ސްކޫލުގެ ދަރިވަރުން ފަރުގެ ތިމާވެށްޓާ ބެހޭ ޕްރޮގްރާމެއް ފުރިހަމަކޮށްފި",
        excerptEn: "Forty students learned about coral reefs, sea turtles and responsible snorkelling in a three-day programme.",
        excerptDv: "ތިން ދުވަހުގެ ޕްރޮގްރާމެއްގައި 40 ދަރިވަރުން ފަރާއި، ވެލާއާއި، ތިމާވެށްޓަށް ގެއްލުމެއް ނުވާނެ ގޮތަށް ސްނޯކެލްކުރުމާ ބެހޭ މަޢުލޫމާތު ހޯދައިފި.",
        contentEn:
          "<p>Forty students from Dhonfanu School completed a three-day reef awareness programme run with the support of the council and the Baa Atoll Biosphere Reserve Office.</p><p>Classroom sessions covered coral reef ecology, the life cycle of sea turtles and the rules that protect Hanifaru Bay. On the final day the students joined a guided snorkel on the house reef to identify fish and coral species.</p><p>The programme is part of the council's plan to make every school leaver an ambassador for the atoll's natural heritage.</p>",
        contentDv:
          "<p>ކައުންސިލާއި ބ. އަތޮޅު ބަޔޮސްފިއަރ ރިޒާރވް އޮފީހުގެ އެހީތެރިކަމާއެކު ހިންގި ތިން ދުވަހުގެ ފަރުގެ ތިމާވެށްޓާ ބެހޭ ޕްރޮގްރާމެއް ދޮންފަނު ސްކޫލުގެ 40 ދަރިވަރުން ފުރިހަމަކޮށްފިއެވެ.</p><p>ކްލާސްރޫމް ސެޝަންތަކުގައި ފަރުގެ ދިރުންތަކާއި، ވެލާގެ ދިރިއުޅުމުގެ ދައުރާއި، ހަނިފަރު ޙިމާޔަތްކުރުމަށް ހަދާފައިވާ ޤަވާޢިދުތަކާ ބެހޭ މަޢުލޫމާތު ދެވުނެވެ. ފަހު ދުވަހު ދަރިވަރުން ގައިޑުންނާއެކު ރަށުގެ ފަރުގައި ސްނޯކެލްކޮށް، މަހާއި މުރަކައިގެ ބާވަތްތައް ދެނެގަތެވެ.</p><p>މި ޕްރޮގްރާމަކީ ސްކޫލް ނިންމާ ކޮންމެ ދަރިވަރަކީ އަތޮޅުގެ ޤުދުރަތީ ތަރިކައިގެ ސަފީރެއްގެ ގޮތުގައި ހެދުމަށް ކައުންސިލުން ރާވާފައިވާ މަސައްކަތްތަކުގެ ބައެކެވެ.</p>",
      },
      {
        slug: "manta-season-briefing-for-guides", category: "ENVIRONMENT", featured: false, published: true,
        imageUrl: "/images/manta.svg", publishedAt: daysFromNow(-16, 10),
        titleEn: "Manta season: council briefs local guides on Hanifaru Bay rules",
        titleDv: "އެންމަޑި ސީޒަން: ހަނިފަރުގެ ޤަވާޢިދުތަކާ ބެހޭ ގޮތުން ރަށުގެ ގައިޑުންނަށް މަޢުލޫމާތު ދީފި",
        excerptEn: "Guides and boat captains were reminded of permit rules, visitor limits and safe distances from marine life.",
        excerptDv: "ހުއްދައާއި، ޒިޔާރަތްކުރެވޭ މީހުންގެ އަދަދާއި، ކަނޑުގެ ދިރުންތަކާ ދެމެދު ބަހައްޓަންޖެހޭ ދުރުމިނާ ބެހޭ ގޮތުން ގައިޑުންނާއި ކެޔޮޅުންނަށް ހަނދާންކޮށްދީފި.",
        contentEn:
          "<p>With manta rays gathering again at Hanifaru Bay, the council hosted a briefing for guides and boat captains based in Dhonfanu.</p><p>Rangers from the Biosphere Reserve Office explained this season's time slots, the limit on the number of snorkellers in the bay and the minimum distance to keep from mantas and whale sharks.</p><h2>Key reminders</h2><ul><li>Only snorkelling is permitted in the bay. Scuba diving is not allowed.</li><li>Every visitor must be accompanied by a licensed guide.</li><li>Do not touch, chase or block the path of any animal.</li></ul><p>Hanifaru Bay is a core protected area of the Baa Atoll UNESCO Biosphere Reserve and an important source of income for the island.</p>",
        contentDv:
          "<p>ހަނިފަރަށް އެންމަޑި އަންނަ މޫސުން ފެށުމާ ގުޅިގެން، ދޮންފަނުގައި މަސައްކަތްކުރާ ގައިޑުންނާއި ކެޔޮޅުންނަށް މަޢުލޫމާތު ދިނުމުގެ ބައްދަލުވުމެއް ކައުންސިލުން ބާއްވައިފިއެވެ.</p><p>ބަޔޮސްފިއަރ ރިޒާރވް އޮފީހުގެ ރޭންޖަރުން މި ސީޒަނުގެ ގަޑިތަކާއި، އެއްފަހަރާ ސްނޯކެލްކުރެވޭ މީހުންގެ އަދަދާއި، އެންމަޑިއާއި ފެހުރިއްސާ ދެމެދު ބަހައްޓަންޖެހޭ ދުރުމިނާ ބެހޭ މަޢުލޫމާތު ދެއްވިއެވެ.</p><h2>ހަނދާންކުރަންވީ ކަންކަން</h2><ul><li>ހަނިފަރުގައި ހުއްދަވަނީ ސްނޯކެލްކުރުން އެކަންޏެވެ. ޑައިވްކުރުމަކީ މަނާކަމެކެވެ.</li><li>ކޮންމެ ޒިޔާރަތްކުރާ ފަރާތަކާއެކު ހުއްދަ އޮތް ގައިޑަކު ހުންނަންވާނެއެވެ.</li><li>އެއްވެސް ދިރުމެއްގައި އަތްލުމާއި، ފަހަތުން ދުވުމާއި، މަގު ބަންދުކުރުމަކީ މަނާކަމެކެވެ.</li></ul><p>ހަނިފަރަކީ ބ. އަތޮޅު ޔުނެސްކޯ ބަޔޮސްފިއަރ ރިޒާރވްގެ ޚާއްޞަކޮށް ޙިމާޔަތްކުރެވިފައިވާ ސަރަޙައްދެއްގެ އިތުރުން، ރަށަށް އާމްދަނީ ލިބޭ މުހިންމު ވަސީލަތެކެވެ.</p>",
      },
      {
        slug: "proposed-budget-2027-published", category: "COUNCIL", featured: false, published: true,
        imageUrl: "/images/civic.svg", publishedAt: daysFromNow(-22, 10),
        titleEn: "Council publishes proposed budget for 2027 after public consultation",
        titleDv: "ރައްޔިތުންގެ ޚިޔާލު ހޯދުމަށްފަހު 2027 ވަނަ އަހަރަށް ލަފާކުރާ ބަޖެޓް ޝާއިޢުކޮށްފި",
        excerptEn: "Harbour facilities, street lighting and waste management are the main priorities in next year's proposed budget.",
        excerptDv: "އަންނަ އަހަރުގެ ލަފާކުރާ ބަޖެޓުގައި އެންމެ އިސްކަންދީފައިވަނީ ބަނދަރުގެ ވަސީލަތްތަކާއި، މަގުބައްތިއާއި، ކުނި މެނޭޖްކުރުމަށް.",
        contentEn:
          "<p>The council has published its proposed budget for 2027 following two public consultation meetings attended by residents, the WDC and island NGOs.</p><p>The proposal sets aside funds for the harbour-front waiting shelter, new LED street lights and upgrades to the Waste Management Centre. It also continues support for school programmes and community events.</p><p>The full document is available in the Downloads section. Residents can send comments through the Contact page before the budget is submitted to the Local Government Authority.</p>",
        contentDv:
          "<p>ރައްޔިތުންނާއި، އަންހެނުންގެ ތަރައްޤީއަށް މަސައްކަތްކުރާ ކޮމިޓީއާއި، ރަށުގެ ޖަމްޢިއްޔާތައް ބައިވެރިވި ދެ ބައްދަލުވުމަކަށްފަހު، 2027 ވަނަ އަހަރަށް ލަފާކުރާ ބަޖެޓް ކައުންސިލުން ޝާއިޢުކޮށްފިއެވެ.</p><p>މި ބަޖެޓުގައި ބަނދަރު ސަރަޙައްދުގެ ހިޔާވަހިކަމާއި، އައު އެލް.އީ.ޑީ މަގުބައްތިތަކާއި، ކުނި މެނޭޖްކުރާ މަރުކަޒު ތަރައްޤީކުރުމަށް ފައިސާ ކަނޑައަޅާފައިވެއެވެ. އަދި ސްކޫލުގެ ޕްރޮގްރާމްތަކާއި މުޖުތަމަޢުގެ ޙަރަކާތްތަކަށް ދެމުންދާ އެހީވެސް ކުރިއަށް ގެންދެވޭނެއެވެ.</p><p>ބަޖެޓުގެ ފުރިހަމަ ލިޔުން ޑައުންލޯޑްސް ބައިން ލިބޭނެއެވެ. ބަޖެޓް ލޯކަލް ގަވަރމަންޓް އޮތޯރިޓީއަށް ހުށަހެޅުމުގެ ކުރިން ރައްޔިތުންނަށް «ގުޅުއްވުމަށް» ޞަފްޙާ މެދުވެރިކޮށް ޚިޔާލު ފޮނުއްވިދާނެއެވެ.</p>",
      },
      {
        slug: "solar-panels-council-secretariat", category: "DEVELOPMENT", featured: false, published: true,
        imageUrl: "/images/solar.svg", publishedAt: daysFromNow(-30, 10),
        titleEn: "Solar panels installed on the council secretariat roof",
        titleDv: "ކައުންސިލްގެ އިދާރާގެ ފުރާޅުގައި ސޯލާ ޕެނަލް ހަރުކޮށްފި",
        excerptEn: "A 15 kW rooftop system now covers most of the secretariat's daytime electricity use.",
        excerptDv: "ފުރާޅުގައި ހަރުކުރި 15 ކިލޯވޮޓުގެ ނިޒާމުން އިދާރާއަށް ދުވާލު ބޭނުންވާ ކަރަންޓުގެ ބޮޑު ބައެއް މިހާރު ލިބޭ.",
        contentEn:
          "<p>A 15 kW rooftop solar system has been installed at the council secretariat, covering most of the building's daytime electricity use.</p><p>The installation is expected to reduce the secretariat's electricity bill by around a third each year. The savings will go towards maintaining street lights and public spaces.</p><p>The council plans to assess the mosque, the school and the Waste Management Centre for similar systems next year.</p>",
        contentDv:
          "<p>ކައުންސިލްގެ އިދާރާގެ ފުރާޅުގައި 15 ކިލޯވޮޓުގެ ސޯލާ ނިޒާމެއް ހަރުކޮށްފިއެވެ. މި ނިޒާމުން ޢިމާރާތަށް ދުވާލު ބޭނުންވާ ކަރަންޓުގެ ބޮޑު ބައެއް ލިބޭނެއެވެ.</p><p>މިކަމުގެ ސަބަބުން އިދާރާގެ ކަރަންޓު ބިލު ކޮންމެ އަހަރަކު ގާތްގަނޑަކަށް ތިންބައިކުޅަ އެއްބައި ކުޑަވާނެ ކަމަށް ލަފާކުރެވެއެވެ. ސަލާމަތްވާ ފައިސާ ބޭނުންކުރާނީ މަގުބައްތިތަކާއި ޢާންމު ތަންތަން މަރާމާތުކުރުމަށެވެ.</p><p>އަންނަ އަހަރު މިސްކިތާއި، ސްކޫލާއި، ކުނި މެނޭޖްކުރާ މަރުކަޒުގައިވެސް މިފަދަ ނިޒާމެއް ޤާއިމުކުރެވޭނެތޯ ބެލުމަށް ކައުންސިލުން ވަނީ ރާވާފައެވެ.</p>",
      },
    ],
  });

  // Downloads
  const documents = [
    { file: "job-application-form", category: "FORM", year: null, pages: 2, days: -4, titleEn: "Job Application Form", titleDv: "ވަޒީފާއަށް އެދޭ ފޯމު", descriptionEn: "Required for all council vacancies.", descriptionDv: "ކައުންސިލްގެ ހުރިހާ ވަޒީފާއަކަށް ކުރިމަތިލުމަށް ބޭނުންވާ ފޯމު." },
    { file: "request-for-information-form", category: "FORM", year: null, pages: 1, days: -20, titleEn: "Request for Information Form", titleDv: "މަޢުލޫމާތު ހޯދުމަށް އެދޭ ފޯމު", descriptionEn: "Right to Information request form.", descriptionDv: "މަޢުލޫމާތު ހޯދައި ލިބިގަތުމުގެ ޙައްޤުގެ ދަށުން ހުށަހަޅާ ފޯމު." },
    { file: "event-and-venue-permit-application", category: "FORM", year: null, pages: 2, days: -35, titleEn: "Event & Venue Permit Application", titleDv: "ޙަރަކާތް ބޭއްވުމާއި ތަން ބޭނުންކުރުމުގެ ހުއްދައަށް އެދޭ ފޯމު", descriptionEn: "For public events and use of the community hall or futsal court.", descriptionDv: "ޢާންމު ޙަރަކާތްތަކާއި ރަށުގެ ހޯލު ނުވަތަ ފުޓްސަލް ދަނޑު ބޭނުންކުރުމަށް." },
    { file: "waste-collection-registration-form", category: "FORM", year: null, pages: 1, days: -50, titleEn: "Waste Collection Registration Form", titleDv: "ކުނި ނެގުމުގެ ޚިދުމަތަށް ރަޖިސްޓްރީވުމުގެ ފޯމު", descriptionEn: "Register a household or business for weekly collection.", descriptionDv: "ހަފްތާއަކު އެއްފަހަރު ކުނި ނެގުމަށް ގެއެއް ނުވަތަ ވިޔަފާރިއެއް ރަޖިސްޓްރީކުރުން." },
    { file: "building-permit-application", category: "FORM", year: null, pages: 3, days: -64, titleEn: "Building Permit Application", titleDv: "ޢިމާރާތްކުރުމުގެ ހުއްދައަށް އެދޭ ފޯމު", descriptionEn: "Submit with site plan and structural drawings.", descriptionDv: "ގޯތީގެ ޗާޓާއި ޢިމާރާތުގެ ކުރެހުންތަކާއެކު ހުށަހަޅުއްވާ." },
    { file: "waste-management-regulation", category: "REGULATION", year: YEAR - 1, pages: 8, days: -210, titleEn: "Dhonfanu Waste Management Regulation", titleDv: "ދޮންފަނުގެ ކުނި މެނޭޖްކުރުމުގެ ޤަވާޢިދު", descriptionEn: "Rules for sorting, collection, fees and penalties.", descriptionDv: "ކުނި ވަކިކުރުމާއި، ނެގުމާއި، ފީއާއި ޖޫރިމަނާއާ ބެހޭ ޤަވާޢިދު." },
    { file: "council-rules-of-procedure", category: "REGULATION", year: YEAR, pages: 12, days: -150, titleEn: "Council Rules of Procedure", titleDv: "ކައުންސިލް ހިންގާ ޤަވާޢިދު", descriptionEn: "How council meetings are convened and decisions are made.", descriptionDv: "ކައުންސިލްގެ ބައްދަލުވުންތައް ބާއްވާނެ ގޮތާއި ނިންމުންތައް ނިންމާނެ ގޮތް." },
    { file: `approved-budget-${YEAR}`, category: "BUDGET", year: YEAR, pages: 14, days: -300, titleEn: `Approved Budget ${YEAR}`, titleDv: `${YEAR} ވަނަ އަހަރުގެ ފާސްކުރި ބަޖެޓް`, descriptionEn: "Income and expenditure approved by the council.", descriptionDv: "ކައުންސިލުން ފާސްކުރި އާމްދަނީއާއި ޚަރަދުގެ ތަފްޞީލު." },
    { file: `proposed-budget-${YEAR + 1}`, category: "BUDGET", year: YEAR + 1, pages: 16, days: -22, titleEn: `Proposed Budget ${YEAR + 1}`, titleDv: `${YEAR + 1} ވަނަ އަހަރަށް ލަފާކުރާ ބަޖެޓް`, descriptionEn: "Published for public comment.", descriptionDv: "ރައްޔިތުންގެ ޚިޔާލު ހޯދުމަށް ޝާއިޢުކުރި ބަޖެޓް." },
    { file: "island-development-plan-2022-2026", category: "PLAN", year: 2022, pages: 30, days: -900, titleEn: "Island Development Plan 2022–2026", titleDv: "ރަށު ތަރައްޤީގެ ޕްލޭން 2022–2026", descriptionEn: "Five-year strategic development plan for Dhonfanu.", descriptionDv: "ދޮންފަނުގެ ފަސް އަހަރުގެ ތަރައްޤީގެ ޕްލޭން." },
    { file: "draft-land-use-plan-2027-2031", category: "PLAN", year: YEAR, pages: 22, days: -7, titleEn: "Draft Land Use Plan 2027–2031", titleDv: "ބިން ބޭނުންކުރުމުގެ ޕްލޭނުގެ ދެލިކޮޕީ 2027–2031", descriptionEn: "Draft for public consultation.", descriptionDv: "ރައްޔިތުންގެ ޚިޔާލު ހޯދުމަށް ހުށަހަޅާ ދެލިކޮޕީ." },
    { file: `annual-report-${YEAR - 1}`, category: "REPORT", year: YEAR - 1, pages: 26, days: -240, titleEn: `Annual Report ${YEAR - 1}`, titleDv: `${YEAR - 1} ވަނަ އަހަރުގެ އަހަރީ ރިޕޯޓު`, descriptionEn: "Activities, projects and performance of the council.", descriptionDv: "ކައުންސިލްގެ ޙަރަކާތްތަކާއި، މަޝްރޫޢުތަކާއި، ހިންގުމުގެ ރިޕޯޓު." },
    { file: `financial-statement-${YEAR - 1}`, category: "REPORT", year: YEAR - 1, pages: 10, days: -235, titleEn: `Financial Statement ${YEAR - 1}`, titleDv: `${YEAR - 1} ވަނަ އަހަރުގެ މާލީ ބަޔާން`, descriptionEn: "Statement of income and expenditure for the year.", descriptionDv: "އަހަރުގެ އާމްދަނީއާއި ޚަރަދުގެ ބަޔާން." },
  ];
  for (const d of documents) {
    const file = writePdf(`${d.file}.pdf`, d.titleEn, [d.descriptionEn, "", "Secretariat of the Dhonfanu Council", "B. Dhonfanu, Republic of Maldives"], d.pages);
    await prisma.document.create({
      data: {
        category: d.category,
        titleEn: d.titleEn,
        titleDv: d.titleDv,
        descriptionEn: d.descriptionEn,
        descriptionDv: d.descriptionDv,
        year: d.year,
        fileUrl: file.url,
        fileName: file.name,
        fileType: "pdf",
        fileSize: file.size,
        publishedAt: daysFromNow(d.days, 9),
      },
    });
  }

  // A few sample citizen messages so the inbox is not empty in the demo
  const wasteService = await prisma.service.findFirst({ where: { titleEn: "Waste Collection" } });
  const samples = [
    {
      type: "COMPLAINT", status: "NEW", locale: "en", days: -1, serviceId: null,
      name: "Sample Resident", phone: "+960 790 0111", email: "",
      subject: "Street light not working near the school",
      message: "The street light at the corner next to the school gate has been off for about a week. It is very dark there at night. Please have it checked.",
    },
    {
      type: "SERVICE", status: "NEW", locale: "dv", days: -2, serviceId: wasteService?.id ?? null,
      name: "ނަމޫނާ ރައްޔިތެއް", phone: "+960 790 0112", email: "",
      subject: "ބޮޑެތި ތަކެތި ނެގުމަށް އެދުން",
      message: "ގޭގައި ހުރި ބާ ފަރުނީޗަރުތަކެއް ނަގައިދެއްވުން އެދެން. އަންނަ ހަފްތާގެ ތެރޭގައި ނަގައިދެވޭނެތޯ؟",
    },
    {
      type: "INQUIRY", status: "RESOLVED", locale: "en", days: -9, serviceId: null,
      name: "Sample Business Owner", phone: "", email: "owner@example.com",
      subject: "Vendor stall permit for the weekend market",
      message: "I would like to know the fee and the documents needed to set up a food stall at the weekend market near the harbour.",
    },
  ];
  for (const [i, s] of samples.entries()) {
    const created = daysFromNow(s.days, 11);
    await prisma.submission.create({
      data: {
        reference: `DC-${YEAR}-${String(i + 1).padStart(5, "0")}`,
        type: s.type,
        status: s.status,
        locale: s.locale,
        name: s.name,
        phone: s.phone,
        email: s.email,
        subject: s.subject,
        message: s.message,
        serviceId: s.serviceId,
        createdAt: created,
        resolvedAt: s.status === "RESOLVED" ? daysFromNow(s.days + 1, 10) : null,
        adminNote: s.status === "RESOLVED" ? "Replied by email with the fee schedule and permit form." : "",
      },
    });
  }

  await seedHeroVideo(prisma);

  console.log("Seed complete: site settings, page texts, statistics, facilities, services, members, announcements, news, documents and sample messages.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
