# Dhonfanu Council Portal

Official bilingual (Dhivehi RTL / English LTR) web portal and CMS for **Dhonfanu Council**, B. Dhonfanu, Maldives.

- **Next.js 15** (App Router, TypeScript, Server Actions)
- **Tailwind CSS 4** with the council palette as theme variables (`src/app/globals.css`)
- **SQLite + Prisma 6** (`prisma/dev.db`)
- **JWT session** in an HTTP-only cookie (`jose`), passwords hashed with `bcryptjs`
- **Local uploads** to `public/uploads` (images and PDFs)

## Quick start

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env        # then set AUTH_SECRET to a long random value
npm run setup               # creates prisma/dev.db and seeds demo content
npm run dev                 # http://localhost:3000
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Admin login

Open `/admin`. The seed creates one account from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env`.
The defaults in `.env.example` are:

| Username | Password        |
| -------- | --------------- |
| `admin`  | `Dhonfanu@2026` |

**Change the password at `/admin/account` before going live.**

### Scripts

| Command            | What it does                                              |
| ------------------ | --------------------------------------------------------- |
| `npm run dev`      | Development server                                        |
| `npm run build`    | `prisma generate` + production build                      |
| `npm run start`    | Serve the production build                                |
| `npm run lint`     | ESLint                                                    |
| `npm run setup`    | `prisma db push` + seed (safe: skips if content exists)   |
| `npm run db:reset` | **Wipes the database** and re-seeds the demo content      |

To wipe content and re-seed without dropping the admin account: `SEED_FORCE=1 npx prisma db seed`.

## What is in the box

**Public site** — `/` (ticker, hero search, e-service pills, announcements board, news, island highlights),
`/announcements` (+ detail), `/news` (+ article), `/council`, `/about`, `/downloads`, `/services`, `/contact`, `/search`.

**Admin CMS (`/admin`)** — Dashboard, Citizen inbox, Announcements & tenders, News (rich-text editor),
Council / WDC / staff, Downloads, E-Services, Island profile (page texts, statistics, facilities),
Site settings (names, logo, hero, ticker, contacts, map, social links), My account.

**Languages** — The visitor's choice is stored in a `locale` cookie (Dhivehi by default) and applied as
`<html lang dir>` in `src/app/(public)/layout.tsx`. Every content field has `…En` / `…Dv` columns; if one is
blank the other language is shown (`pick()` in `src/lib/i18n.ts`). Interface strings live in the same file.

**Fonts** — Plus Jakarta Sans and Noto Sans Thaana via `next/font/google`. Faruma is declared as a local
fallback; to self-host it, put `faruma.woff2` in `public/fonts` and add the `url(...)` source noted in `globals.css`.

## Demo data — replace before launch

Everything created by `prisma/seed.ts` is **placeholder content for demonstration**: councillor, WDC and staff
names, phone numbers, email addresses, reference numbers, island statistics, news stories, and the sample PDFs
(marked "SAMPLE DOCUMENT"). The illustrations in `public/images` are generated SVG placeholders. Replace all
of it from `/admin`. Dhivehi text should be proofread by council staff.

## Project layout

```
prisma/schema.prisma        data model          prisma/seed.ts   demo content
src/middleware.ts           protects /admin
src/lib/                    db, auth, session, i18n, uploads, sanitize, format
src/app/(public)/           public pages        src/app/admin/   CMS + server actions
src/app/uploads/[...path]/  serves files uploaded after the build
src/components/site|admin/  UI components
public/images/              bundled placeholders   public/uploads/  CMS uploads
```

## Deploying on a Linux VPS (Ubuntu example)

```bash
# 1. Node.js 20+, nginx, and the code
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo mkdir -p /var/www/dhonfanu && sudo chown $USER /var/www/dhonfanu
cd /var/www/dhonfanu        # copy or git-clone the project here

# 2. Configure
cp .env.example .env
nano .env                   # set AUTH_SECRET, ADMIN_PASSWORD; keep COOKIE_SECURE="true"

# 3. Install, create the database, build
npm ci
npm run setup               # omit the seed on a real launch: `npx prisma db push` only
npm run build

# 4. Run with a process manager
sudo npm i -g pm2
pm2 start npm --name dhonfanu -- start
pm2 save && pm2 startup
```

nginx site (`/etc/nginx/sites-available/dhonfanu`):

```nginx
server {
    server_name dhonfanu.gov.mv www.dhonfanu.gov.mv;
    client_max_body_size 25m;                 # admin PDF uploads

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/dhonfanu /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx && sudo certbot --nginx   # HTTPS
```

Notes:

- **HTTPS is required** for admin login in production because the session cookie is `Secure`. Only while
  testing over plain `http://` set `COOKIE_SECURE="false"`.
- **Back up** two things: `prisma/dev.db` and `public/uploads/`.
- **Updating**: `git pull && npm ci && npx prisma db push && npm run build && pm2 restart dhonfanu`.
- Login and contact-form rate limits are held in memory, so run a single app process.
