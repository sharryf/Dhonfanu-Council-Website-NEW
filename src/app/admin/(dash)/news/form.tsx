import type { News } from "@prisma/client";
import { NEWS_CATEGORIES, NEWS_CATEGORY_LABELS } from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import { ActionForm } from "@/components/admin/ActionForm";
import { Bilingual, Checkbox, FileInput, Grid, Section, Select, TextInput } from "@/components/admin/fields";
import { RichText } from "@/components/admin/RichText";
import { saveNews } from "../../actions";

export function NewsForm({ item }: { item?: News }) {
  return (
    <ActionForm action={saveNews} submitLabel={item ? "Save changes" : "Save article"}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <Section title="Publishing">
        <Grid cols={3}>
          <Select
            label="Category"
            name="category"
            defaultValue={item?.category ?? "COUNCIL"}
            options={NEWS_CATEGORIES.map((c) => ({ value: c, label: NEWS_CATEGORY_LABELS[c] }))}
          />
          <TextInput label="Date" name="publishedAt" type="date" defaultValue={toDateInput(item?.publishedAt ?? new Date())} />
          <TextInput label="Web address (slug)" name="slug" defaultValue={item?.slug} hint="Leave empty to create it from the English title." />
        </Grid>
        <Grid>
          <Checkbox label="Published" name="published" defaultChecked={item?.published ?? false} hint="Untick to keep the article as a draft." />
          <Checkbox label="Feature on the home page" name="featured" defaultChecked={item?.featured ?? false} hint="Featured articles are shown first." />
        </Grid>
      </Section>

      <Section title="Headline & summary">
        <Bilingual label="Title" name="title" en={item?.titleEn} dv={item?.titleDv} />
        <Bilingual label="Summary" name="excerpt" en={item?.excerptEn} dv={item?.excerptDv} multiline rows={3} hint="One or two sentences shown on news cards." />
        <FileInput label="Featured image" name="image" kind="image" currentUrl={item?.imageUrl} />
      </Section>

      <Section title="Article" description="Write in one or both languages. Pasted text is inserted without formatting.">
        <RichText label="Article (English)" name="contentEn" defaultValue={item?.contentEn} />
        <RichText label="Article (ދިވެހި)" name="contentDv" defaultValue={item?.contentDv} dv />
      </Section>
    </ActionForm>
  );
}
