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

/** Visual slow-down: the room should drift, a touch slower than real time. */
const BASE_RATE = 0.87;
/** Barely-there per-cycle variation so repeats never feel mechanical. */
const rateJitter = () => BASE_RATE * (0.97 + Math.random() * 0.03);
/** Overlap (seconds of source time) used to crossfade one cycle into the next. */
const OVERLAP = 1.6;
const FADE_MS = 1600;

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * One ambient mood. When active it runs two stacked <video> elements of the
 * same file and crossfades A -> B -> A near the end of each cycle, so the loop
 * point is never visible (no black frame, no jump, no pause). Only the active
 * scene ever runs the double-layer technique; inactive scenes stay as a single
 * paused element. Purely visual — music playback is untouched.
 */
function SceneLayer({ moodId, active }: { moodId: MoodId; active: boolean }) {
  const scene = useMemo(() => SCENES.find((s) => s.id === moodId)!, [moodId]);
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const [front, setFront] = useState<0 | 1>(0);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const a = aRef.current;
    const b = bRef.current;
    if (!a) return;

    const play = (el: HTMLVideoElement) => {
      el.playbackRate = reduced ? BASE_RATE : rateJitter();
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    if (!active) {
      a.pause();
      b?.pause();
      return;
    }

    if (reduced) {
      // Minimal motion: hold a single still frame, no crossfades.
      a.pause();
      b?.pause();
      return;
    }

    // A newly selected mood always begins its cycle from the top.
    try {
      a.currentTime = 0;
    } catch {
      /* not seekable yet */
    }
    setFront(0);
    play(a);
    if (!b) return;

    let current: 0 | 1 = 0;
    let swapping = false;

    const tick = () => {
      const cur = current === 0 ? a : b;
      const next = current === 0 ? b : a;
      const dur = cur.duration;
      if (!swapping && Number.isFinite(dur) && dur > 0 && cur.currentTime >= dur - OVERLAP) {
        swapping = true;
        try {
          next.currentTime = 0;
        } catch {
          /* not seekable yet */
        }
        play(next);
        current = current === 0 ? 1 : 0;
        setFront(current);
        window.setTimeout(() => {
          cur.pause();
          try {
            cur.currentTime = 0;
          } catch {
            /* ignore */
          }
          swapping = false;
        }, FADE_MS + 120);
      }
    };

    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [active, reduced]);

  const common = {
    className: "scene-video",
    src: videoUrl(scene),
    poster: posterUrl(scene),
    muted: true,
    playsInline: true,
    "webkit-playsinline": "true",
    disablePictureInPicture: true,
    controls: false,
    "aria-hidden": true as const,
    tabIndex: -1,
    preload: moodId === DEFAULT_MOOD ? ("auto" as const) : ("metadata" as const),
  };

  return (
    <>
      <video {...common} ref={aRef} style={{ opacity: active && front === 0 ? 1 : 0 }} />
      {active && !reduced && (
        <video {...common} ref={bRef} preload="auto" style={{ opacity: front === 1 ? 1 : 0 }} />
      )}
    </>
  );
}


export function BethakBackground({ mood = DEFAULT_MOOD }: { mood?: MoodId }) {
  // Start on the approved look, then settle into the real hour after mount
  // (keeps SSR markup stable and the change imperceptible).
  const [phase, setPhase] = useState<Phase>("night");
  // Only the default scene is loaded initially; others mount on first use.
  const [mounted, setMounted] = useState<MoodId[]>([DEFAULT_MOOD]);
  // The scene actually on screen. It lags `mood` while the veil covers the swap.
  const [shown, setShown] = useState<MoodId>(mood);
  const [veiled, setVeiled] = useState(false);

  useEffect(() => {
    const tick = () => setPhase(phaseForHour(new Date().getHours()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setMounted((m) => (m.includes(mood) ? m : [...m, mood]));
  }, [mood]);

  // Mood change: darken the room, swap the scene behind the darkness, lift it.
  useEffect(() => {
    if (mood === shown) return;
    const reduced = prefersReducedMotion();
    const coverMs = reduced ? 120 : 300;
    setVeiled(true);
    const swap = window.setTimeout(() => {
      setShown(mood);
      const lift = window.setTimeout(() => setVeiled(false), reduced ? 60 : 140);
      timers.push(lift);
    }, coverMs);
    const timers: number[] = [swap];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [mood, shown]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="room-frame">
        <div className="room-breathe">
          {mounted.map((id) => (
            <SceneLayer key={id} moodId={id} active={id === shown} />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-[oklch(0.15_0.03_60_/_0.08)]" />
      <div className="hour-wash" data-phase={phase} />
      <div className="room-vignette" aria-hidden="true" />
      <div className={`mood-veil ${veiled ? "mood-veil-in" : ""}`} aria-hidden="true" />
      <div className="center-scrim" aria-hidden="true" />
      <div className="lamp-glow" aria-hidden="true" />
    </div>
  );
}
