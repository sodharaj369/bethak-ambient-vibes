import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BethakBackground } from "@/components/BethakBackground";
import { ChaiSpot } from "@/components/ChaiSpot";
import { HarmoniumSpot } from "@/components/HarmoniumSpot";
import { BethakTitle } from "@/components/BethakTitle";
import { MoodSelector } from "@/components/MoodSelector";
import { DEFAULT_MOOD, type MoodId } from "@/data/scenes";
import { useRoomPan } from "@/hooks/useRoomPan";

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
 * Development lab for the mobile pan. The pan itself now lives in
 * `useRoomPan` and runs in production; this route only adds the readout.
 */
function PanLab() {
  const [mood, setMood] = useState<MoodId>(DEFAULT_MOOD);
  const { stageRef, style, handlers, pan, range, geom, portrait, setPanTo, stopSettle } =
    useRoomPan(mood);

  const covered = geom.frameW > 0 && geom.left <= 0.5 && geom.right >= geom.viewW - 0.5;

  return (
    <main className="bethak-screen" style={style} {...handlers}>
      <div ref={stageRef} className="absolute inset-0">
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
            onChange={(e) => {
              stopSettle();
              setPanTo(Number(e.target.value));
            }}
            style={{ width: "100%" }}
            aria-label="Pan position"
          />
          <button type="button" onClick={() => { stopSettle(); setPanTo(0); }} style={{ textDecoration: "underline" }}>
            reset to default crop
          </button>
        </div>
      )}
    </main>
  );
}
