import { useMemo } from "react";
import { sceneById, type MoodId } from "@/data/scenes";
import { lightWeights, type LightMode } from "@/lib/roomLight";

/**
 * The atmospheric light of the bethak.
 *
 * Three very soft CSS layers — a darkening, a warm tone and a localized glow
 * around the room's own lamp — living *inside* the room frame, so they pan
 * with the video and the hotspots. Nothing here touches the video itself.
 */
export function RoomLight({ mood, mode }: { mood: MoodId; mode: LightMode }) {
  const scene = sceneById(mood);
  const w = useMemo(() => lightWeights(mode, mood), [mode, mood]);
  const light = scene?.light;

  const vars = {
    "--light-x": light?.x ?? "80%",
    "--light-y": light?.y ?? "44%",
    "--light-mx": light?.mobile?.x ?? light?.x ?? "80%",
    "--light-my": light?.mobile?.y ?? light?.y ?? "44%",
  } as React.CSSProperties;

  return (
    <div className="room-light" style={vars} aria-hidden="true">
      <div className="room-light-dim" style={{ opacity: w.dim }} />
      <div className="room-light-warm" style={{ opacity: w.warm }} />
      <div className="room-light-candle" style={{ opacity: w.candle }} />
    </div>
  );
}
