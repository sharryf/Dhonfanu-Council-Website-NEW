import sanitizeHtml from "sanitize-html";

/** Cleans HTML from the admin rich-text editor before it is stored. */
export function cleanRichText(html: string): string {
  const cleaned = sanitizeHtml(html ?? "", {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a", "div"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      div: "p",
      b: "strong",
      i: "em",
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  }).trim();
  // An editor that was emptied still leaves markup behind; treat that as blank.
  const text = cleaned.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text ? cleaned : "";
}

/** Plain-text preview of rich text (for excerpts and search results). */
export function stripHtml(html: string): string {
  return sanitizeHtml(html ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
