import { useCallback, useEffect, useRef, useState } from "react";
import { sceneById, type MoodId } from "@/data/scenes";
import { playHarmoniumNote, preloadHarmoniumNote } from "@/services/harmoniumSound";


/** How long the single small line holds before it fades. */
const LINE_MS = 1800;
/** The room's second secret only offers itself after the chai was found. */
const FOUND_KEY = "bethakHarmoniumFound";
const CHAI_FOUND_KEY = "bethakChaiFound";
const LINE = "एक सुर...";

/**
 * The harmonium — the second small secret in the room.
 *
 * One invisible, scene-positioned hotspot. One tap plays one soft note and,
 * the first time, lets a tiny line surface. Nothing starts, nothing stops:
 * the ghazal, the ambience and the video are never touched.
 */
export function HarmoniumSpot({ mood, enabled }: { mood: MoodId; enabled: boolean }) {
  const scene = sceneById(mood)!;
  const spot = scene?.harmonium;
  const [line, setLine] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [found, setFound] = useState(true);
  /** Only hint once the chai has already been discovered in this visit. */
  const [chaiFound, setChaiFound] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Warm the note up once the hotspot is live so every tap sounds instantly.
  useEffect(() => {
    if (enabled) preloadHarmoniumNote();
  }, [enabled]);

  // Watch (cheaply) for the chai discovery so the second hint can begin.
  useEffect(() => {
    const read = () => {
      try {
        setFound((prev) => prev || window.sessionStorage.getItem(FOUND_KEY) === "1");
        setChaiFound((prev) => prev || window.sessionStorage.getItem(CHAI_FOUND_KEY) === "1");
      } catch {
        /* storage blocked — keep whatever this visit already knows */
      }
    };
    setFound(() => {
      try {
        return window.sessionStorage.getItem(FOUND_KEY) === "1";
      } catch {
        return false;
      }
    });
    read();
    // Instant: the chai tap announces itself. The poll is only a safety net.
    const onChai = () => setChaiFound(true);
    window.addEventListener("bethak:chai-found", onChai);
    const id = window.setInterval(read, 2000);
    return () => {
      window.removeEventListener("bethak:chai-found", onChai);
      window.clearInterval(id);
    };
  }, []);

  /**
   * One tap = one note, for the whole visit.
   * `found` only governs the discovery glow and the single first-time line —
   * it never gates the hotspot or this handler.
   */
  const strike = useCallback(() => {
    playHarmoniumNote();
    const first = !found;
    if (!first) return;
    setFound(true);
    try {
      window.sessionStorage.setItem(FOUND_KEY, "1");
    } catch {
      /* storage blocked — the hint simply ends with this tap */
    }

    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setLine(LINE);
    setVisible(true);
    timers.current.push(window.setTimeout(() => setVisible(false), LINE_MS));
    timers.current.push(window.setTimeout(() => setLine(null), LINE_MS + 700));
  }, [found]);


  if (!spot) return null;

  const m = scene.mobile;
  const frameVars = m ? ({ "--m-x": m.x, "--m-y": m.y } as React.CSSProperties) : undefined;

  const spotVars = {
    "--chai-x": spot.x,
    "--chai-y": spot.y,
    "--chai-w": spot.w,
    "--chai-h": spot.h,
    "--chai-mw": spot.mobile?.w ?? spot.w,
    "--chai-mh": spot.mobile?.h ?? spot.h,
    "--chai-mx": spot.mobile?.x ?? spot.x,
    "--chai-my": spot.mobile?.y ?? spot.y,
  } as React.CSSProperties;

  return (
    <div className="chai-layer" aria-hidden={!enabled}>
      <div className="room-frame" style={frameVars}>
        <div className="chai-spot" style={spotVars}>
          <button
            type="button"
            className="chai-hit"
            aria-label="Harmonium"
            tabIndex={enabled ? 0 : -1}
            onClick={strike}
          >
            {enabled && chaiFound && !found && (
              <span className="chai-hint harmonium-hint" aria-hidden="true" />
            )}
            {import.meta.env.DEV && (
              <span className="hotspot-debug" data-label="HARMONIUM HOTSPOT" aria-hidden="true" />
            )}
          </button>
          {line && (
            <span
              className={`chai-line font-devanagari${visible ? " chai-line-on" : ""}`}
              role="status"
            >
              {line}
            </span>
          )}
        </div>
      </div>
      {import.meta.env.DEV && (
        <div className="debug-panel">
          <div>chai discovered: {chaiFound ? "YES" : "NO"}</div>
          <div>harmonium discovered: {found ? "YES" : "NO"}</div>
          <div>harmonium hotspot: {enabled && chaiFound && !found ? "ACTIVE" : "INACTIVE"}</div>
        </div>
      )}
    </div>
  );
}
