"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type Props = { src: string; poster: string; pauseLabel: string; playLabel: string };

type NetworkInformation = { saveData?: boolean };

/**
 * Looping background video for the home hero. It is drawn over the hero image,
 * which stays visible until the video can play. The video is not loaded at all
 * for visitors who prefer reduced motion or have data-saver turned on.
 */
export function HeroVideo({ src, poster, pauseLabel, playLabel }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as Navigator & { connection?: NetworkInformation }).connection?.saveData === true;
    const update = () => setAllowed(!reduced.matches && !saveData);
    update();
    reduced.addEventListener("change", update);
    return () => reduced.removeEventListener("change", update);
  }, []);

  if (!allowed) return null;

  function toggle() {
    const el = video.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  }

  return (
    <>
      <video
        ref={video}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        onCanPlay={() => setReady(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={`absolute inset-0 -z-20 size-full object-cover transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
      />
      {ready && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? pauseLabel : playLabel}
          title={playing ? pauseLabel : playLabel}
          className="absolute bottom-4 end-4 z-10 flex size-9 items-center justify-center rounded-full bg-navy/60 text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-teal sm:bottom-6 sm:end-6"
        >
          {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
        </button>
      )}
    </>
  );
}
