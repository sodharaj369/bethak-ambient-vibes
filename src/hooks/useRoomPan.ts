import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Mobile-portrait room pan (promoted from /pan-lab, unchanged in behaviour).
 *
 * Pan 0 is exactly the production crop. The travel limits are derived purely
 * from the rendered geometry of `.room-frame`, so a frame edge can never enter
 * the viewport at any pan position. Hard clamp, no rubber band; a short eased
 * settle on release.
 */
const EDGE_GUARD = 1; // px kept in reserve against sub-pixel rounding
const SETTLE_MS = 420;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export type RoomPan = {
  /** Ref to place on the element that contains the `.room-frame` layers. */
  stageRef: React.RefObject<HTMLDivElement | null>;
  /** Style carrying `--pan-x`; put it on the outer screen element. */
  style: React.CSSProperties;
  /** Pointer handlers for the outer screen element. */
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
    onLostPointerCapture: (e: React.PointerEvent) => void;
  };
  pan: number;
  range: { min: number; max: number };
  geom: { frameW: number; viewW: number; left: number; right: number };
  portrait: boolean;
  setPanTo: (v: number) => void;
  stopSettle: () => void;
};

export function useRoomPan(depKey?: unknown): RoomPan {
  const [pan, setPan] = useState(0);
  const [range, setRange] = useState({ min: 0, max: 0 });
  const [geom, setGeom] = useState({ frameW: 0, viewW: 0, left: 0, right: 0 });
  const [portrait, setPortrait] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef(0);
  const drag = useRef<{ id: number; x: number; from: number; last: number; t: number; v: number } | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const measure = useCallback(() => {
    const viewW = window.innerWidth;
    setPortrait(viewW < 768 && window.innerHeight >= viewW);
    const frame = stageRef.current?.querySelector<HTMLElement>(".room-frame");
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

  useEffect(() => {
    let frameEl: HTMLElement | null = null;
    const ro = new ResizeObserver(() => measure());
    const attach = () => {
      const el = stageRef.current?.querySelector<HTMLElement>(".room-frame") ?? null;
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
  }, [measure, depKey]);

  // Any range change immediately pulls the current position back inside it.
  useEffect(() => {
    setPan((p) => clamp(p, range.min, range.max));
  }, [range]);

  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    },
    [],
  );

  const span = range.max - range.min;

  const stopSettle = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

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

  const onPointerDown = (e: React.PointerEvent) => {
    if (!portrait || span === 0) return;
    stopSettle();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* capture unavailable */
    }
    drag.current = { id: e.pointerId, x: e.clientX, from: pan, last: e.clientX, t: performance.now(), v: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const now = performance.now();
    const dt = now - d.t;
    if (dt > 0) d.v = (e.clientX - d.last) / dt;
    d.last = e.clientX;
    d.t = now;
    setPan(clamp(d.from + (e.clientX - d.x), range.min, range.max));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d?.id !== e.pointerId) return;
    drag.current = null;
    settle(pan, Math.max(-2, Math.min(2, d.v)));
  };

  const style = useMemo(
    () => ({ "--pan-x": `${pan}px`, touchAction: "pan-y" }) as React.CSSProperties,
    [pan],
  );

  return {
    stageRef,
    style,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onLostPointerCapture: onPointerUp,
    },
    pan,
    range,
    geom,
    portrait,
    setPanTo: (v: number) => setPan(clamp(v, range.min, range.max)),
    stopSettle,
  };
}
