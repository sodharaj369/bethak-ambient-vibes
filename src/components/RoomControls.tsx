import { useCallback, useEffect, useState } from "react";
import type { MoodId } from "@/data/scenes";
import { sessionFor } from "@/data/sessions";
import { getAmbienceEngine } from "@/services/ambienceEngine";

/**
 * Two very small objects in the room: the ambience switch and a way to pass
 * this bethak on. No panels, no toasts — just quiet words.
 */
export function RoomControls({ mood }: { mood: MoodId }) {
  const engine = getAmbienceEngine();
  const [pref, setPref] = useState(() => engine.getPref());
  const [copied, setCopied] = useState(false);

  useEffect(() => engine.subscribe(setPref), [engine]);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(id);
  }, [copied]);

  const share = useCallback(async () => {
    const session = sessionFor(mood);
    const url = new URL(window.location.href);
    url.searchParams.set("mood", mood);
    const link = url.toString();
    const data = {
      title: `बैठक — ${session.title}`,
      text: session.description,
      url: link,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      /* dismissed or blocked — stay silent */
    }
  }, [mood]);

  return (
    <div className="room-controls">
      <button
        type="button"
        className={`room-word${pref.enabled ? " room-word-on" : ""}`}
        aria-pressed={pref.enabled}
        title={pref.enabled ? "Ambience on" : "Ambience off"}
        onClick={() => engine.setEnabled(!pref.enabled)}
      >
        <span className="room-word-mark" aria-hidden="true">
          ♪
        </span>
        <span className={`room-word-label${pref.enabled ? " room-word-said" : ""}`}>Ambience</span>
      </button>
      {pref.enabled && (
        <input
          type="range"
          className="amb-slider"
          min={0}
          max={100}
          step={5}
          value={Math.round(pref.volume * 100)}
          aria-label="Ambience volume"
          onChange={(e) => engine.setVolume(Number(e.target.value) / 100)}
        />
      )}
      <button
        type="button"
        className="room-word"
        title="Share this bethak"
        onClick={() => void share()}
      >
        <span className="room-word-mark" aria-hidden="true">
          ↗
        </span>
        <span className={`room-word-label${copied ? " room-word-said" : ""}`}>
          {copied ? "Bethak copied" : "Share"}
        </span>
      </button>
    </div>
  );
}
