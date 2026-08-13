import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BethakBackground } from "@/components/BethakBackground";
import { ChaiSpot } from "@/components/ChaiSpot";
import { HarmoniumSpot } from "@/components/HarmoniumSpot";
import { BethakTitle } from "@/components/BethakTitle";
import { MoodSelector } from "@/components/MoodSelector";
import { DEFAULT_MOOD, type MoodId } from "@/data/scenes";

const TITLE = "BETHAK — mobile pan prototype";
const DESCRIPTION =
  "Internal prototype: a mobile-only horizontal pan across the existing BETHAK room scene. Not part of the live room.";

export const Route = createFileRoute("/pan-lab")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
  }),
  component: PanLab,
});

/**
 * Mobile pan prototype. Nothing here is wired into the live room: the page
 * simply renders the existing scene and lets a finger slide the 16:9 frame
 * sideways inside its own overscan. This is a crop that moves — not 360°
 * video. Desktop keeps the production framing untouched.
 */
const PROD_LEFT = -350; // candidate production limit (drag toward the left side of the room)
const PROD_RIGHT = 150; // candidate production limit
const RESIST_ZONE = 90; // px before a limit where movement starts easing off
const SETTLE_MS = 420; // gentle inertial settling after release

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Maps raw finger travel to frame travel: 1:1 through the middle, then a
 * progressively softer ratio inside the last RESIST_ZONE px, hard stop at the
 * limit. No rubber band — the frame never passes the clamp.
 */
function resist(target: number, min: number, max: number) {
  if (target > max - RESIST_ZONE) {
    const zone = Math.min(RESIST_ZONE, max - min);
    if (zone <= 0) return max;
    const over = Math.min(target - (max - zone), zone * 3);
    const t = Math.min(1, over / (zone * 3));
    return max - zone + zone * easeOutCubic(t);
  }
  if (target < min + RESIST_ZONE) {
    const zone = Math.min(RESIST_ZONE, max - min);
    if (zone <= 0) return min;
    const over = Math.min(min + zone - target, zone * 3);
    const t = Math.min(1, over / (zone * 3));
    return min + zone - zone * easeOutCubic(t);
  }
  return target;
}

function PanLab() {
  const [mood, setMood] = useState<MoodId>(DEFAULT_MOOD);
  const [pan, setPan] = useState(0);
  // Available overscan, measured from the scene. The production candidate
  // range is a tighter, asymmetric subset of this.
  const [overscan, setOverscan] = useState({ min: 0, max: 0 });
  const [portrait, setPortrait] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; from: number; last: number; t: number; v: number } | null>(null);
  const raf = useRef<number | null>(null);

  // Production candidate limits: never wider than the real overscan.
  const range = useMemo(
    () => ({
      min: Math.max(overscan.min, PROD_LEFT),
      max: Math.min(overscan.max, PROD_RIGHT),
    }),
    [overscan],
  );

  // How far the frame may slide before an edge would enter the viewport.
  const measure = useCallback(() => {
    const isPortrait = window.innerWidth < 768 && window.innerHeight >= window.innerWidth;
    setPortrait(isPortrait);
    const frame = stage.current?.querySelector<HTMLElement>(".room-frame");
    if (!frame) return;
    const r = frame.getBoundingClientRect();
    // Undo the current pan to get the neutral (default crop) rect.
    const left = r.left - pan;
    const right = r.right - pan;
    const max = Math.max(0, Math.round(-left)); // slide right, reveal left side
    const min = -Math.max(0, Math.round(right - window.innerWidth));
    setOverscan({ min, max });
  }, [pan]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood]);

  useEffect(() => {
    setPan((p) => Math.max(range.min, Math.min(range.max, p)));
  }, [range]);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  const span = range.max - range.min;

  const stopSettle = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  // Short eased glide toward the projected resting point. Settles, never bounces.
  const settle = (from: number, velocity: number) => {
    const projected = from + velocity * 120; // px/ms * ms
    const to = Math.max(range.min, Math.min(range.max, projected));
    if (Math.abs(to - from) < 1) return;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / SETTLE_MS);
      setPan(from + (to - from) * easeOutCubic(t));
      raf.current = t < 1 ? requestAnimationFrame(step) : null;
    };
    raf.current = requestAnimationFrame(step);
  };

  const onDown = (e: React.PointerEvent) => {
    if (!portrait || span === 0) return;
    stopSettle();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* capture unavailable */
    }
    drag.current = { id: e.pointerId, x: e.clientX, from: pan, last: e.clientX, t: performance.now(), v: 0 };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const now = performance.now();
    const dt = now - d.t;
    if (dt > 0) d.v = (e.clientX - d.last) / dt;
    d.last = e.clientX;
    d.t = now;
    // Vertical movement is ignored entirely; only dx counts.
    const next = d.from + (e.clientX - d.x);
    setPan(resist(next, range.min, range.max));
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d?.id !== e.pointerId) return;
    drag.current = null;
    settle(pan, Math.max(-2, Math.min(2, d.v)));
  };


  const pct = pan >= 0 ? (range.max ? Math.round((pan / range.max) * 100) : 0) : range.min ? -Math.round((pan / range.min) * 100) : 0;
  const vars = useMemo(
    () => ({ "--pan-x": `${pan}px`, touchAction: "pan-y" }) as React.CSSProperties,
    [pan],
  );


  return (
    <main
      className="bethak-screen"
      style={vars}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
    >
      <div ref={stage} className="absolute inset-0">
        <BethakBackground mood={mood} started />
      </div>

      <ChaiSpot mood={mood} enabled />
      <HarmoniumSpot mood={mood} enabled />

      <div className="title-slot">
        <BethakTitle />
      </div>
      <MoodSelector mood={mood} onChange={setMood} />

      {import.meta.env.DEV && (
        <div
          style={{
            position: "absolute",
            left: 12,
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
            right: 12,
            zIndex: 60,
            fontSize: 11,
            lineHeight: 1.5,
            letterSpacing: "0.04em",
            color: "oklch(0.93 0.02 80 / 0.72)",
            background: "oklch(0.16 0.03 55 / 0.55)",
            borderRadius: 10,
            padding: "8px 10px",
            pointerEvents: "auto",
          }}
        >
          <div>
            pan {pct}% ({Math.round(pan)}px) · prod L {range.min}px / R {range.max}px ·{" "}
            available {overscan.min}…{overscan.max}px ·{" "}
            {portrait ? "portrait: pan on" : "desktop/landscape: pan off"}
          </div>
          <input
            type="range"
            min={range.min || -1}
            max={range.max || 1}
            value={Math.round(pan)}

            onChange={(e) => { stopSettle(); setPan(Number(e.target.value)); }}
            style={{ width: "100%" }}
            aria-label="Pan position"
          />
          <button type="button" onClick={() => { stopSettle(); setPan(0); }} style={{ textDecoration: "underline" }}>
            reset to default crop
          </button>
        </div>
      )}
    </main>
  );
}
