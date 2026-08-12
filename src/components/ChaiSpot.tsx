import { useCallback, useEffect, useRef, useState } from "react";
import { sceneById, type MoodId } from "@/data/scenes";
import { CHAI_FIRST_LINE, nextChaiLine } from "@/data/chaiLines";
import { playChaiSound } from "@/services/chaiSound";

/** How long a whisper holds before it fades away again. */
const LINE_MS = 1800;

/**
 * Chai Ki Chuski — the one small secret in the room.
 *
 * An invisible, scene-positioned hotspot over the chai cups. Tapping it makes
 * a quiet ceramic sound and, most of the time, lets a small thought surface
 * for a couple of seconds. Nothing is stored, nothing else is touched:
 * the ghazal, the ambience and the video keep running exactly as they were.
 */
export function ChaiSpot({ mood, enabled }: { mood: MoodId; enabled: boolean }) {
  const scene = sceneById(mood)!;
  const chai = scene?.chai;
  const [line, setLine] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [sipped, setSipped] = useState(false);
  const [nudge, setNudge] = useState(0);
  const lastLine = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const sip = useCallback(() => {
    playChaiSound();
    setNudge((n) => n + 1);

    // The first sip always answers. After that the room mostly stays quiet.
    const speak = !sipped || Math.random() < 0.4;
    if (!sipped) setSipped(true);
    if (!speak) return;

    const next = sipped ? nextChaiLine(lastLine.current) : CHAI_FIRST_LINE;
    lastLine.current = next;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setLine(next);
    setVisible(true);
    timers.current.push(window.setTimeout(() => setVisible(false), LINE_MS));
    timers.current.push(window.setTimeout(() => setLine(null), LINE_MS + 700));
  }, [sipped]);

  if (!chai) return null;

  const m = scene.mobile;
  const frameVars = m ? ({ "--m-x": m.x, "--m-y": m.y } as React.CSSProperties) : undefined;

  const spotVars = {
    "--chai-x": chai.x,
    "--chai-y": chai.y,
    "--chai-w": chai.w,
    "--chai-h": chai.h,
    "--chai-mw": chai.mobile?.w ?? chai.w,
    "--chai-mh": chai.mobile?.h ?? chai.h,
    "--chai-mx": chai.mobile?.x ?? chai.x,
    "--chai-my": chai.mobile?.y ?? chai.y,
  } as React.CSSProperties;

  return (
    <div className="chai-layer" aria-hidden={!enabled}>
      <div className="room-frame" style={frameVars}>
        <div className="chai-spot" style={spotVars}>
          <button
            type="button"
            className="chai-hit"
            aria-label="Chai Ki Chuski"
            tabIndex={enabled ? 0 : -1}
            onClick={sip}
          >
            <span key={nudge} className="chai-warm" aria-hidden="true" />
          </button>
          {line && (
            <span className={`chai-line font-devanagari${visible ? " chai-line-on" : ""}`} role="status">
              {line}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
