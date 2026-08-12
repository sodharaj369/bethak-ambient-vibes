import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_MOOD, SCENES, posterUrl, videoUrl, type MoodId } from "@/data/scenes";

type Phase = "evening" | "night" | "late" | "deep";

function phaseForHour(h: number): Phase {
  if (h >= 18 && h < 20) return "evening";
  if (h >= 20 && h < 23) return "night";
  if (h >= 23 || h < 2) return "late";
  if (h >= 2 && h < 5) return "deep";
  return "night";
}

/** One ambient video layer. Mounted lazily, crossfaded by opacity. */
function SceneLayer({ moodId, active }: { moodId: MoodId; active: boolean }) {
  const scene = useMemo(() => SCENES.find((s) => s.id === moodId)!, [moodId]);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active) {
      // Autoplay is only allowed muted; ignore rejections (in-app browsers).
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      el.pause();
    }
  }, [active]);

  return (
    <video
      ref={ref}
      className="scene-video"
      style={{ opacity: active ? 1 : 0 }}
      src={videoUrl(scene)}
      poster={posterUrl(scene)}
      autoPlay={active}
      muted
      loop
      playsInline
      webkit-playsinline="true"

      disablePictureInPicture
      controls={false}
      preload={moodId === DEFAULT_MOOD ? "auto" : "metadata"}
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}

export function BethakBackground({ mood = DEFAULT_MOOD }: { mood?: MoodId }) {
  // Start on the approved look, then settle into the real hour after mount
  // (keeps SSR markup stable and the change imperceptible).
  const [phase, setPhase] = useState<Phase>("night");
  // Only the default scene is loaded initially; others mount on first use.
  const [mounted, setMounted] = useState<MoodId[]>([DEFAULT_MOOD]);

  useEffect(() => {
    const tick = () => setPhase(phaseForHour(new Date().getHours()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setMounted((m) => (m.includes(mood) ? m : [...m, mood]));
  }, [mood]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="room-frame">
        <div className="room-breathe">
          {mounted.map((id) => (
            <SceneLayer key={id} moodId={id} active={id === mood} />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-[oklch(0.15_0.03_60_/_0.08)]" />
      <div className="hour-wash" data-phase={phase} />
      <div className="room-vignette" aria-hidden="true" />
      <div className="center-scrim" aria-hidden="true" />
      <div className="lamp-glow" aria-hidden="true" />
    </div>


  );
}
