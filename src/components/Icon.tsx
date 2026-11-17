import {
  Anchor,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Compass,
  Droplets,
  FileSearch,
  FileText,
  Fish,
  Gavel,
  Globe,
  HandHeart,
  HeartPulse,
  House,
  Landmark,
  Lightbulb,
  MapPinned,
  Megaphone,
  MessageSquareWarning,
  Navigation,
  Plane,
  Recycle,
  Ruler,
  Scale,
  School,
  Shield,
  Ship,
  Sprout,
  Stamp,
  Store,
  Sun,
  TreePalm,
  Trophy,
  Users,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Icons staff can choose in the CMS for services, statistics and facilities. */
export const ICONS: Record<string, LucideIcon> = {
  Anchor,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Compass,
  Droplets,
  FileSearch,
  FileText,
  Fish,
  Gavel,
  Globe,
  HandHeart,
  HeartPulse,
  House,
  Landmark,
  Lightbulb,
  MapPinned,
  Megaphone,
  MessageSquareWarning,
  Navigation,
  Plane,
  Recycle,
  Ruler,
  Scale,
  School,
  Shield,
  Ship,
  Sprout,
  Stamp,
  Store,
  Sun,
  TreePalm,
  Trophy,
  Users,
  Waves,
  Zap,
};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] ?? FileText;
  return <Cmp className={className} aria-hidden="true" />;
}

// Brand marks (not part of lucide).
export function SocialIcon({ name, className }: { name: "facebook" | "x" | "instagram" | "youtube" | "viber"; className?: string }) {
  const paths: Record<string, string> = {
    facebook:
      "M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.6-1.5h1.4V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z",
    x: "M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.3L5.6 21h-3l7.1-8.1L2.3 3h6.2l4.3 5.7L17.8 3zm-1 16.2h1.7L7.6 4.7H5.8l11 14.5z",
    instagram:
      "M12 7.3a4.7 4.7 0 100 9.4 4.7 4.7 0 000-9.4zm0 7.7a3 3 0 110-6 3 3 0 010 6zm6-7.9a1.1 1.1 0 11-2.2 0 1.1 1.1 0 012.2 0zM21 8c-.1-1.4-.4-2.7-1.4-3.6C18.700 3.400 17.400 3.100 16 3c-1.600-.1-6.400-.1-8 0-1.400.1-2.700.4-3.600 1.400C3.400 5.300 3.100 6.600 3 8c-.1 1.600-.1 6.400 0 8 .1 1.400.4 2.700 1.400 3.600.9 1 2.200 1.300 3.600 1.400 1.600.1 6.400.1 8 0 1.400-.1 2.700-.4 3.600-1.400 1-.9 1.300-2.200 1.400-3.600.1-1.600.1-6.400 0-8zm-2 9.700a3 3 0 01-1.700 1.700c-1.200.5-4 .4-5.300.4s-4.100.1-5.300-.4A3 3 0 015 17.700c-.5-1.200-.4-4-.4-5.300S4.500 8.300 5 7.100A3 3 0 016.700 5.400c1.200-.5 4-.4 5.300-.4s4.100-.1 5.300.4A3 3 0 0119 7.100c.5 1.200.4 4 .4 5.300s.1 4.100-.4 5.300z",
    youtube:
      "M21.6 7.2a2.500 2.500 0 00-1.800-1.800C18.200 5 12 5 12 5s-6.200 0-7.800.4A2.500 2.500 0 002.400 7.200C2 8.800 2 12 2 12s0 3.200.4 4.800a2.500 2.500 0 001.800 1.800C5.800 19 12 19 12 19s6.200 0 7.800-.4a2.500 2.500 0 001.800-1.800c.4-1.600.4-4.800.4-4.800s0-3.200-.4-4.800zM10 15V9l5.200 3-5.200 3z",
    viber:
      "M12 2.500c-4.500 0-8.500 1.400-8.500 7.300 0 3 .9 4.900 2.500 6v3.400c0 .5.6.800 1 .4l2.300-2.300c.9.1 1.800.2 2.700.2 4.500 0 8.500-1.400 8.500-7.700S16.500 2.500 12 2.500zm3.700 11.300c-.3.600-1.300 1.100-1.900 1-2.900-.6-6-3.700-6.500-6.500-.1-.6.5-1.600 1-1.900.4-.2.8-.1 1 .2l1 1.500c.2.3.1.7-.1.9l-.5.5c.5 1.200 1.600 2.300 2.800 2.800l.5-.5c.2-.2.6-.3.9-.1l1.500 1c.4.300.5.700.3 1.100z",
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
