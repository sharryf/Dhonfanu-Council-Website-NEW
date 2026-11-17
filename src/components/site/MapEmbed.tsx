import { ExternalLink } from "lucide-react";

/** Keyless OpenStreetMap embed centred on the coordinates set in Site Settings. */
export function MapEmbed({
  lat,
  lng,
  zoom,
  title,
  openLabel,
  className = "",
}: {
  lat: number;
  lng: number;
  zoom: number;
  title: string;
  openLabel: string;
  className?: string;
}) {
  // Convert zoom to a bounding box around the marker.
  const span = 360 / Math.pow(2, Math.min(Math.max(zoom, 3), 19)) * 1.2;
  const bbox = [lng - span, lat - span / 2, lng + span, lat + span / 2].map((n) => n.toFixed(5)).join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;
  const link = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;

  return (
    <div className={`card overflow-hidden ${className}`}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block h-72 w-full border-0 sm:h-80"
      />
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs text-navy/60">
        <bdi dir="ltr">
          {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
        </bdi>
        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-teal hover:underline">
          {openLabel}
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
