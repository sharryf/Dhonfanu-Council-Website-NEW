// Shared option lists. Labels for the public site live in src/lib/i18n.ts;
// the English labels here are used by the admin dashboard.

export const ANNOUNCEMENT_CATEGORIES = ["NOTICE", "TENDER", "JOB"] as const;
export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];
export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  NOTICE: "General notice",
  TENDER: "Tender / Bid",
  JOB: "Job vacancy",
};

export const NEWS_CATEGORIES = ["COUNCIL", "COMMUNITY", "ENVIRONMENT", "DEVELOPMENT", "EVENTS"] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];
export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  COUNCIL: "Council",
  COMMUNITY: "Community",
  ENVIRONMENT: "Environment",
  DEVELOPMENT: "Development",
  EVENTS: "Events",
};

export const MEMBER_GROUPS = ["COUNCIL", "WDC", "ADMIN"] as const;
export type MemberGroup = (typeof MEMBER_GROUPS)[number];
export const MEMBER_GROUP_LABELS: Record<MemberGroup, string> = {
  COUNCIL: "Council",
  WDC: "Women's Development Committee",
  ADMIN: "Secretariat / Administration",
};

export const DOCUMENT_CATEGORIES = ["FORM", "REGULATION", "BUDGET", "PLAN", "REPORT", "OTHER"] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  FORM: "Forms",
  REGULATION: "Regulations",
  BUDGET: "Budgets",
  PLAN: "Development plans",
  REPORT: "Annual reports",
  OTHER: "Other",
};

export const SUBMISSION_TYPES = ["INQUIRY", "COMPLAINT", "SERVICE", "FEEDBACK"] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];
export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  INQUIRY: "Inquiry",
  COMPLAINT: "Complaint",
  SERVICE: "Service request",
  FEEDBACK: "Feedback",
};

/** Editable text blocks (PageContent rows). */
export const PAGE_KEYS = [
  { key: "about.intro", label: "About Dhonfanu — introduction", hasImage: true },
  { key: "about.history", label: "About Dhonfanu — history & community", hasImage: true },
  { key: "about.hanifaru", label: "About Dhonfanu — Hanifaru Bay & Biosphere Reserve", hasImage: true },
  { key: "council.mission", label: "The Council — mission", hasImage: false },
  { key: "council.vision", label: "The Council — vision", hasImage: false },
  { key: "services.intro", label: "E-Services — introduction", hasImage: false },
] as const;

export function oneOf<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return list.includes(value as T) ? (value as T) : fallback;
}
