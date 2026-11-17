import { notFound } from "next/navigation";

// Any unknown public URL renders the branded, bilingual 404 page.
export default function CatchAll() {
  notFound();
}
