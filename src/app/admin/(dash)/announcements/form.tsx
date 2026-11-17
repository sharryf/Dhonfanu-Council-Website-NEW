import type { Announcement } from "@prisma/client";
import { ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_CATEGORY_LABELS } from "@/lib/constants";
import { toDateInput, toDateTimeInput } from "@/lib/format";
import { ActionForm } from "@/components/admin/ActionForm";
import { Bilingual, Checkbox, FileInput, Grid, Section, Select, TextInput } from "@/components/admin/fields";
import { saveAnnouncement } from "../../actions";

export function AnnouncementForm({ item }: { item?: Announcement }) {
  return (
    <ActionForm action={saveAnnouncement} submitLabel={item ? "Save changes" : "Publish announcement"}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <Section title="Details">
        <Grid>
          <Select
            label="Type"
            name="category"
            defaultValue={item?.category ?? "NOTICE"}
            options={ANNOUNCEMENT_CATEGORIES.map((c) => ({ value: c, label: ANNOUNCEMENT_CATEGORY_LABELS[c] }))}
          />
          <TextInput label="Reference number" name="refNumber" defaultValue={item?.refNumber} placeholder="(IUL)DC/2026/01" />
          <TextInput label="Publish date" name="publishDate" type="date" defaultValue={toDateInput(item?.publishDate ?? new Date())} required />
          <TextInput
            label="Deadline (optional)"
            name="deadline"
            type="datetime-local"
            defaultValue={toDateTimeInput(item?.deadline)}
            hint="Maldives time. Sets the Open / Closed badge. Leave empty for general notices."
          />
        </Grid>
        <Checkbox label="Visible on the public site" name="published" defaultChecked={item?.published ?? true} hint="Untick to keep it as a hidden draft." />
      </Section>

      <Section title="Content" description="Fill in one or both languages. If one is left blank the other is shown to all visitors.">
        <Bilingual label="Title" name="title" en={item?.titleEn} dv={item?.titleDv} />
        <Bilingual label="Details" name="content" en={item?.contentEn} dv={item?.contentDv} multiline rows={9} />
      </Section>

      <Section title="Attachment" description="The signed announcement, bid documents or application form.">
        <FileInput
          label="PDF attachment"
          name="attachment"
          kind="document"
          currentUrl={item?.attachmentUrl}
          currentName={item?.attachmentName}
          currentSize={item?.attachmentSize}
        />
      </Section>
    </ActionForm>
  );
}
