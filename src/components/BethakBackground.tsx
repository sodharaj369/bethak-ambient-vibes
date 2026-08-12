import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_MOOD,
  SCENES,
  posterUrl,
  reverseVideoUrl,
  videoUrl,
  type MoodId,
} from "@/data/scenes";

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
/** How close to the final frame we hand over to the other direction. */
const HANDOFF = 0.12;

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * One ambient mood, played as an endless ping-pong: the forward file runs to
 * its last frame, then a pre-rendered reversed copy takes over from its first
 * frame (which is the same picture), then back again. Because the direction
 * change happens on a shared frame there is no jump, no fade and no visible
 * loop point. Purely visual — music playback is untouched.
 */
function SceneLayer({ moodId, active }: { moodId: MoodId; active: boolean }) {
  const scene = useMemo(() => SCENES.find((s) => s.id === moodId)!, [moodId]);
  const fwdRef = useRef<HTMLVideoElement>(null);
  const revRef = useRef<HTMLVideoElement>(null);
  const [front, setFront] = useState<0 | 1>(0);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const fwd = fwdRef.current;
    const rev = revRef.current;
    if (!fwd) return;

    const play = (el: HTMLVideoElement) => {
      el.playbackRate = BASE_RATE;
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    if (!active || reduced) {
      fwd.pause();
      rev?.pause();
      return;
    }

    // A newly selected mood always begins its cycle from the top.
    try {
      fwd.currentTime = 0;
    } catch {
      /* not seekable yet */
    }
    setFront(0);
    play(fwd);
    if (!rev) return;

    let current: 0 | 1 = 0;
    let swapping = false;

    const swap = () => {
      const cur = current === 0 ? fwd : rev;
      const next = current === 0 ? rev : fwd;
      swapping = true;
      try {
        next.currentTime = 0;
      } catch {
        /* not seekable yet */
      }
      play(next);
      current = current === 0 ? 1 : 0;
      setFront(current);
      cur.pause();
      try {
        cur.currentTime = 0;
      } catch {
        /* ignore */
      }
      swapping = false;
    };

    const tick = () => {
      const cur = current === 0 ? fwd : rev;
      const dur = cur.duration;
      if (swapping) return;
      if (Number.isFinite(dur) && dur > 0 && cur.currentTime >= dur - HANDOFF) swap();
    };

    const onEnded = () => {
      if (!swapping) swap();
    };

    fwd.addEventListener("ended", onEnded);
    rev.addEventListener("ended", onEnded);
    const id = window.setInterval(tick, 60);
    return () => {
      window.clearInterval(id);
      fwd.removeEventListener("ended", onEnded);
      rev.removeEventListener("ended", onEnded);
    };
  }, [active, reduced]);

  const common = {
    className: "scene-video",
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
      <video
        {...common}
        ref={fwdRef}
        src={videoUrl(scene)}
        style={{ opacity: active && front === 0 ? 1 : 0, transition: "none" }}
      />
      {active && !reduced && (
        <video
          {...common}
          ref={revRef}
          src={reverseVideoUrl(scene)}
          preload="auto"
          style={{ opacity: front === 1 ? 1 : 0, transition: "none" }}
        />
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
    const swap = window.setTimeout(() => setShown(mood), coverMs);
    return () => window.clearTimeout(swap);
  }, [mood, shown]);

  // New scene is mounted and running underneath: lift the darkness away.
  useEffect(() => {
    if (!veiled || mood !== shown) return;
    const reduced = prefersReducedMotion();
    const id = window.setTimeout(() => setVeiled(false), reduced ? 60 : 160);
    return () => window.clearTimeout(id);
  }, [veiled, mood, shown]);

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
