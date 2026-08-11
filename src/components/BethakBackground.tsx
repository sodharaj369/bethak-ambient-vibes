import { useEffect, useState } from "react";
import roomAsset from "@/assets/bethak-room.png.asset.json";
import { RoomAmbience } from "@/components/RoomAmbience";

type Phase = "evening" | "night" | "late" | "deep";

function phaseForHour(h: number): Phase {
  if (h >= 18 && h < 20) return "evening";
  if (h >= 20 && h < 23) return "night";
  if (h >= 23 || h < 2) return "late";
  if (h >= 2 && h < 5) return "deep";
  return "night";
}

export function BethakBackground() {
  // Start on the approved look, then settle into the real hour after mount
  // (keeps SSR markup stable and the change imperceptible).
  const [phase, setPhase] = useState<Phase>("night");

  useEffect(() => {
    const tick = () => setPhase(phaseForHour(new Date().getHours()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="room-frame">
        <div className="room-breathe">
        <img
          src={roomAsset.url}
          alt="A quiet Indian sitting room at night: a wooden diwan with cushions, chai on a low table, a harmonium, a warm lamp and a moonlit window"
          className="h-full w-full object-cover"
        />
        <RoomAmbience />
        </div>
      </div>
      <div className="absolute inset-0 bg-[oklch(0.15_0.03_60_/_0.08)]" />
      <div className="hour-wash" data-phase={phase} />
      <div className="lamp-glow" aria-hidden="true" />
    </div>
  );
}
