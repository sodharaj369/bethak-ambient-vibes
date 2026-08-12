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
function PanLab() {
  const [mood, setMood] = useState<MoodId>(DEFAULT_MOOD);
  const [pan, setPan] = useState(0);
  // Asymmetric: the default crop does not sit in the middle of the frame,
  // so each direction gets exactly its own overscan and no more.
  const [range, setRange] = useState({ min: 0, max: 0 });
  const [portrait, setPortrait] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; from: number } | null>(null);

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
    setRange({ min, max });
    setPan((p) => Math.max(min, Math.min(max, p)));
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

  const span = range.max - range.min;

  const onDown = (e: React.PointerEvent) => {
    if (!portrait || span === 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, from: pan };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    // Vertical movement is ignored entirely; only dx counts.
    const next = d.from + (e.clientX - d.x);
    setPan(Math.max(range.min, Math.min(range.max, next)));
  };
  const onUp = (e: React.PointerEvent) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const pct = pan >= 0 ? (range.max ? Math.round((pan / range.max) * 100) : 0) : range.min ? -Math.round((pan / range.min) * 100) : 0;
  const vars = useMemo(() => ({ "--pan-x": `${pan}px` }) as React.CSSProperties, [pan]);


  return (
    <main
      className="bethak-screen"
      style={vars}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      
    >
      <div ref={stage} className="absolute inset-0" style={{ touchAction: "pan-y" }}>
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
            pan {pct}% ({pan}px of ±{limit}px) · {portrait ? "portrait: pan on" : "desktop/landscape: pan off"}
          </div>
          <input
            type="range"
            min={-limit || -1}
            max={limit || 1}
            value={pan}
            onChange={(e) => setPan(Number(e.target.value))}
            style={{ width: "100%" }}
            aria-label="Pan position"
          />
          <button type="button" onClick={() => setPan(0)} style={{ textDecoration: "underline" }}>
            reset to default crop
          </button>
        </div>
      )}
    </main>
  );
}
