import { getSite } from "@/lib/site";
import { ActionForm } from "@/components/admin/ActionForm";
import { Bilingual, Checkbox, FileInput, Grid, Section, TextInput } from "@/components/admin/fields";
import { AdminHeader } from "@/components/admin/ui";
import { saveSettings } from "../../actions";

export const metadata = { title: "Site settings" };

export default async function SettingsPage() {
  const s = await getSite();
  return (
    <>
      <AdminHeader title="Site settings" description="Council identity, home page hero, urgent notice ticker, contact details, map and social media." />
      <ActionForm action={saveSettings} submitLabel="Save settings">
        <Section title="Council identity" description="Shown in the header, footer and browser tab.">
          <Bilingual label="Council name" name="councilName" en={s.councilNameEn} dv={s.councilNameDv} />
          <Bilingual label="Short description" name="tagline" en={s.taglineEn} dv={s.taglineDv} multiline rows={2} hint="Appears in the footer." />
          <FileInput label="Logo" name="logo" kind="image" currentUrl={s.logoUrl} fallbackUrl="/images/logo.svg" hint="Square PNG works best. Up to 5 MB." />
        </Section>

        <Section title="Home page hero" description="The large banner at the top of the home page.">
          <Bilingual label="Headline" name="heroTitle" en={s.heroTitleEn} dv={s.heroTitleDv} />
          <Bilingual label="Subtitle" name="heroSubtitle" en={s.heroSubtitleEn} dv={s.heroSubtitleDv} multiline rows={2} />
          <FileInput label="Banner image" name="heroImage" kind="image" currentUrl={s.heroImageUrl} fallbackUrl="/images/hero.svg" hint="Wide landscape photo, at least 1600 px wide. Up to 5 MB." />
        </Section>

        <Section title="Urgent notice ticker" description="Scrolling strip under the navigation. Separate several notices with the | character.">
          <Checkbox label="Show the ticker" name="tickerEnabled" defaultChecked={s.tickerEnabled} hint="Untick to hide it when there is nothing urgent." />
          <Bilingual label="Ticker text" name="ticker" en={s.tickerEn} dv={s.tickerDv} multiline rows={3} />
        </Section>

        <Section title="Contact details">
          <Grid cols={4}>
            <TextInput label="Hotline" name="hotline" defaultValue={s.hotline} />
            <TextInput label="Office phone" name="phone" defaultValue={s.phone} />
            <TextInput label="Viber" name="viber" defaultValue={s.viber} />
            <TextInput label="Email" name="email" type="email" defaultValue={s.email} />
          </Grid>
          <Bilingual label="Office hours" name="officeHours" en={s.officeHoursEn} dv={s.officeHoursDv} />
          <Bilingual label="Address" name="address" en={s.addressEn} dv={s.addressDv} multiline rows={2} />
        </Section>

        <Section title="Map location" description="Coordinates of the council office, used for the embedded map on Contact and About.">
          <Grid cols={3}>
            <TextInput label="Latitude" name="mapLat" type="number" step="0.000001" defaultValue={s.mapLat} required />
            <TextInput label="Longitude" name="mapLng" type="number" step="0.000001" defaultValue={s.mapLng} required />
            <TextInput label="Zoom (3–19)" name="mapZoom" type="number" defaultValue={s.mapZoom} />
          </Grid>
        </Section>

        <Section title="Social media" description="Leave a field empty to hide that icon.">
          <Grid>
            <TextInput label="Facebook URL" name="facebookUrl" type="url" defaultValue={s.facebookUrl} placeholder="https://facebook.com/…" />
            <TextInput label="X (Twitter) URL" name="twitterUrl" type="url" defaultValue={s.twitterUrl} placeholder="https://x.com/…" />
            <TextInput label="Instagram URL" name="instagramUrl" type="url" defaultValue={s.instagramUrl} placeholder="https://instagram.com/…" />
            <TextInput label="YouTube URL" name="youtubeUrl" type="url" defaultValue={s.youtubeUrl} placeholder="https://youtube.com/…" />
          </Grid>
        </Section>

        <Section title="Footer">
          <Bilingual label="Footer note" name="footerNote" en={s.footerNoteEn} dv={s.footerNoteDv} hint="Optional short text after the copyright line." />
        </Section>
      </ActionForm>
    </>
  );
}
