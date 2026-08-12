import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_MOOD, SCENES, posterUrl, sceneById, videoUrl, type MoodId } from "@/data/scenes";

type Phase = "evening" | "night" | "late" | "deep";

function phaseForHour(h: number): Phase {
  if (h >= 18 && h < 20) return "evening";
  if (h >= 20 && h < 23) return "night";
  if (h >= 23 || h < 2) return "late";
  if (h >= 2 && h < 5) return "deep";
  return "night";
}

/** Tunable loop behaviour (no UI — tweak here). */
const LOOP = {
  /** Visual slow-down: the room drifts a touch slower than real time. */
  RATE: 0.87,
  /** Seconds before the end at which the incoming layer starts, invisible. */
  OVERLAP: 1.5,
  /** Silent head start before the opacity handover begins (ms). */
  PREROLL_MS: 220,
  /** Length of the opacity handover (ms). */
  CROSSFADE_MS: 1200,
  /** Incoming layer curve: gentle ease-in-out. */
  EASE_IN: "cubic-bezier(0.42, 0, 0.58, 1)",
  /** Outgoing layer curve: stays dominant, then releases late. */
  EASE_OUT: "cubic-bezier(0.85, 0, 0.9, 0.55)",
};

/** Mood switch fade: short, hidden under the veil. */
const SWITCH_MS = 260;

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * One ambient mood. The active scene runs two identical, pixel-aligned video
 * layers: shortly before the current one ends the other starts from frame 0
 * while still invisible, then a slow eased opacity handover makes it dominant.
 * The old layer is paused and rewound invisibly underneath and the roles swap.
 * No reverse playback, no black overlay, no camera transform — and the music
 * system is never touched.
 */
function SceneLayer({
  moodId,
  active,
  visible,
  onReady,
}: {
  moodId: MoodId;
  active: boolean;
  visible: boolean;
  /** Fired once this scene has real pixels on screen (used to lift the veil). */
  onReady?: (id: MoodId) => void;
}) {
  const scene = useMemo(() => SCENES.find((s) => s.id === moodId)!, [moodId]);
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const [front, setFront] = useState<0 | 1>(0);
  /** The still first frame stays on top until real video pixels arrive. */
  const [painted, setPainted] = useState(false);
  /** The second loop layer only mounts once the first one is actually running. */
  const [twin, setTwin] = useState(false);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const a = aRef.current;
    const b = bRef.current;
    if (!a) return;

    const play = (el: HTMLVideoElement) => {
      el.playbackRate = LOOP.RATE;
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    if (!active || reduced) {
      a.pause();
      b?.pause();
      return;
    }

    try {
      a.currentTime = 0;
    } catch {
      /* not seekable yet */
    }
    setFront(0);
    play(a);
    const twinTimer = window.setTimeout(() => setTwin(true), 1200);
    if (!b) {
      return () => window.clearTimeout(twinTimer);
    }

    let current: 0 | 1 = 0;
    let swapping = false;
    const timers: number[] = [];

    const beginHandover = () => {
      const cur = current === 0 ? a : b;
      const next = current === 0 ? b : a;
      swapping = true;

      // Start the incoming layer invisibly and let it settle before fading.
      try {
        next.currentTime = 0;
      } catch {
        /* not seekable yet */
      }
      play(next);

      timers.push(
        window.setTimeout(() => {
          current = current === 0 ? 1 : 0;
          setFront(current);

          timers.push(
            window.setTimeout(() => {
              cur.pause();
              try {
                cur.currentTime = 0;
              } catch {
                /* ignore */
              }
              swapping = false;
            }, LOOP.CROSSFADE_MS + 150),
          );
        }, LOOP.PREROLL_MS),
      );
    };

    const tick = () => {
      if (swapping) return;
      const cur = current === 0 ? a : b;
      const dur = cur.duration;
      if (Number.isFinite(dur) && dur > 0 && cur.currentTime >= dur - LOOP.OVERLAP) {
        beginHandover();
      }
    };

    const id = window.setInterval(tick, 120);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(twinTimer);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [active, reduced, twin]);

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

  // Real pixels on screen: only now may the poster layer step aside.
  const markPainted = () => {
    setPainted(true);
    onReady?.(moodId);
  };

  const fade = (visible: boolean) => ({
    opacity: visible ? 1 : 0,
    transition: `opacity ${LOOP.CROSSFADE_MS}ms ${visible ? LOOP.EASE_IN : LOOP.EASE_OUT}`,
  });

  // A scene that is on screen but not running (before entry, reduced motion)
  // is already "ready" — its poster is the picture.
  useEffect(() => {
    if (visible && (!active || reduced)) onReady?.(moodId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, active, reduced, moodId]);

  // The whole scene is one stacked unit: mood switching fades this wrapper,
  // the loop handover happens between the two videos inside it. Keeping the
  // two fades separate is what stops an old mood lingering under a new label.
  return (
    <div
      className="scene-unit"
      aria-hidden="true"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${SWITCH_MS}ms ease`,
        pointerEvents: "none",
      }}
    >
      <video
        {...common}
        ref={aRef}
        onPlaying={markPainted}
        onLoadedData={markPainted}
        style={fade(!active || front === 0)}
      />
      {active && !reduced && twin && (
        <video {...common} ref={bRef} preload="auto" style={fade(front === 1)} />
      )}
      {/* Poster layer: always mounted, above the video, never a blank frame. */}
      <div
        className="scene-poster"
        style={{
          backgroundImage: `url(${posterUrl(scene)})`,
          opacity: painted && active ? 0 : 1,
        }}
      />
    </div>
  );
}


export function BethakBackground({
  mood = DEFAULT_MOOD,
  started = true,
}: {
  mood?: MoodId;
  /** The ambient video only runs once the visitor has entered the room. */
  started?: boolean;
}) {

  // Start on the approved look, then settle into the real hour after mount
  // (keeps SSR markup stable and the change imperceptible).
  const [phase, setPhase] = useState<Phase>("night");
  // Only the default scene is loaded initially; others mount on first use.
  const [mounted, setMounted] = useState<MoodId[]>([DEFAULT_MOOD]);
  // The scene actually on screen. It lags `mood` while the veil covers the swap.
  const [shown, setShown] = useState<MoodId>(mood);
  const [veiled, setVeiled] = useState(false);
  /** The scene whose pixels are confirmed on screen. */
  const [ready, setReady] = useState<MoodId | null>(null);
  const handleReady = useCallback((id: MoodId) => setReady(id), []);

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
    setReady(null);
    const swap = window.setTimeout(() => setShown(mood), coverMs);
    return () => window.clearTimeout(swap);
  }, [mood, shown]);

  // New scene has actually painted underneath: only then lift the darkness,
  // so the label and the picture can never disagree. A safety timer keeps the
  // room from staying dark if a file is slow.
  useEffect(() => {
    if (!veiled || mood !== shown) return;
    const reduced = prefersReducedMotion();
    const lift = () => setVeiled(false);
    const settle = window.setTimeout(lift, ready === shown ? (reduced ? 60 : SWITCH_MS) : 1400);
    return () => window.clearTimeout(settle);
  }, [veiled, mood, shown, ready]);

  const m = sceneById(shown)?.mobile;
  const frameVars = m
    ? ({
        "--m-x": m.x,
        "--m-y": m.y,
      } as React.CSSProperties)
    : undefined;

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden room-stage">
      <div className="room-frame" style={frameVars}>
        <div className="room-breathe">
          {mounted.map((id) => (
            <SceneLayer
              key={id}
              moodId={id}
              active={started && id === shown}
              visible={id === shown}
              onReady={handleReady}
            />
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
