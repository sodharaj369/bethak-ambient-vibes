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
 * Mobile pan prototype. The scene is never re-framed: pan 0 is exactly the
 * production V3 crop. The travel limits are derived purely from the rendered
 * geometry of `.room-frame` (which already covers the viewport), so a frame
 * edge can never enter the viewport at any pan position.
 */
const EDGE_GUARD = 1; // px kept in reserve at each side against sub-pixel rounding
const SETTLE_MS = 420; // gentle inertial settling after release

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function PanLab() {
  const [mood, setMood] = useState<MoodId>(DEFAULT_MOOD);
  const [pan, setPan] = useState(0);
  /** Safe travel derived from the rendered frame; always contains 0. */
  const [range, setRange] = useState({ min: 0, max: 0 });
  const [geom, setGeom] = useState({ frameW: 0, viewW: 0, left: 0, right: 0 });
  const [portrait, setPortrait] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const panRef = useRef(0);
  const drag = useRef<{ id: number; x: number; from: number; last: number; t: number; v: number } | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  /**
   * Measure the frame as rendered right now, undo the pan currently applied to
   * it, and turn the neutral rect into limits:
   *   max pan (rightward) = how far the left edge is off-screen
   *   min pan (leftward)  = how far the right edge is off-screen (negative)
   */
  const measure = useCallback(() => {
    const viewW = window.innerWidth;
    setPortrait(viewW < 768 && window.innerHeight >= viewW);
    const frame = stage.current?.querySelector<HTMLElement>(".room-frame");
    if (!frame) return;
    const r = frame.getBoundingClientRect();
    if (r.width === 0) return;
    const p = panRef.current;
    const left = r.left - p; // neutral (pan = 0) frame edges
    const right = r.right - p;

    const max = Math.max(0, Math.floor(-left) - EDGE_GUARD);
    const min = Math.min(0, Math.ceil(viewW - right) + EDGE_GUARD);

    setRange((prev) => (prev.min === min && prev.max === max ? prev : { min, max }));
    setGeom({ frameW: Math.round(r.width), viewW, left: Math.round(r.left), right: Math.round(r.right) });
  }, []);

  // Re-measure on every geometry change: resize, orientation, mood swap, and
  // whenever the frame element itself is re-laid out (video metadata, dvh
  // changes from browser chrome collapsing, etc).
  useEffect(() => {
    let frameEl: HTMLElement | null = null;
    const ro = new ResizeObserver(() => measure());
    const attach = () => {
      const el = stage.current?.querySelector<HTMLElement>(".room-frame") ?? null;
      if (el && el !== frameEl) {
        if (frameEl) ro.unobserve(frameEl);
        frameEl = el;
        ro.observe(el);
      }
      measure();
    };
    attach();
    const t = window.setInterval(attach, 500);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      window.clearInterval(t);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [measure, mood]);

  // Any range change immediately pulls the current position back inside it.
  useEffect(() => {
    setPan((p) => clamp(p, range.min, range.max));
  }, [range]);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  const span = range.max - range.min;

  const stopSettle = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  // Short eased glide toward the projected resting point. Settles, never bounces.
  const settle = (from: number, velocity: number) => {
    const to = clamp(from + velocity * 120, range.min, range.max);
    if (Math.abs(to - from) < 1) return;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / SETTLE_MS);
      setPan(clamp(from + (to - from) * easeOutCubic(t), range.min, range.max));
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
    // Vertical movement is ignored entirely; only dx counts. Hard clamp: the
    // frame never travels past a safe limit, so there is no rubber band.
    setPan(clamp(d.from + (e.clientX - d.x), range.min, range.max));
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d?.id !== e.pointerId) return;
    drag.current = null;
    settle(pan, Math.max(-2, Math.min(2, d.v)));
  };

  const vars = useMemo(
    () => ({ "--pan-x": `${pan}px`, touchAction: "pan-y" }) as React.CSSProperties,
    [pan],
  );

  // Live cover check against the actual rendered rect (not the model).
  const covered = geom.frameW > 0 && geom.left <= 0.5 && geom.right >= geom.viewW - 0.5;

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
          data-pan-debug
          data-pan={Math.round(pan)}
          data-min={range.min}
          data-max={range.max}
          data-safe={covered ? "1" : "0"}
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
            frame {geom.frameW}px · viewport {geom.viewW}px · pan {Math.round(pan)}px · safe{" "}
            {range.min}…{range.max}px ·{" "}
            <strong style={{ color: covered ? "oklch(0.85 0.13 150)" : "oklch(0.7 0.2 25)" }}>
              {covered ? "SAFE" : "EDGE EXPOSED"}
            </strong>{" "}
            · {portrait ? "portrait: pan on" : "desktop/landscape: pan off"}
          </div>
          <input
            type="range"
            min={range.min || -1}
            max={range.max || 1}
            value={Math.round(pan)}
            onChange={(e) => { stopSettle(); setPan(clamp(Number(e.target.value), range.min, range.max)); }}
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
