/**
 * AMBIENCE — the room's own sound, underneath the ghazal.
 *
 * Deliberately separate from the music engine and from the video: one looping
 * HTMLAudioElement per mood, created lazily on first use, only ever one of them
 * audible. Mood changes crossfade over ~1.5s. If a file is missing or the
 * browser blocks playback, everything stays silent — never an error, never UI.
 */
import type { MoodId } from "@/data/scenes";
import { sessionFor } from "@/data/sessions";

const PREF_KEY = "bethakAmbience";
/** Fallback order — the first format the browser can play wins. */
const AMBIENCE_FORMATS = ["mp3", "ogg"] as const;
const CROSSFADE_MS = 1500;
const STEP_MS = 50;

export type AmbiencePref = { enabled: boolean; volume: number };

const DEFAULT_PREF: AmbiencePref = { enabled: true, volume: 0.7 };

export function readAmbiencePref(): AmbiencePref {
  if (typeof window === "undefined") return DEFAULT_PREF;
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULT_PREF;
    const p = JSON.parse(raw) as Partial<AmbiencePref>;
    return {
      enabled: typeof p.enabled === "boolean" ? p.enabled : DEFAULT_PREF.enabled,
      volume:
        // Older visits stored a much quieter default; lift those to the new one.
        typeof p.volume === "number" && p.volume > 0.4 && p.volume <= 1
          ? p.volume
          : DEFAULT_PREF.volume,
    };
  } catch {
    return DEFAULT_PREF;
  }
}

function writeAmbiencePref(pref: AmbiencePref) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(pref));
  } catch {
    /* storage blocked — preference is a nicety */
  }
}

const base = () => import.meta.env.BASE_URL || "/";

type Layer = {
  el: HTMLAudioElement;
  gain: number;
  fade: ReturnType<typeof setInterval> | null;
};

export class AmbienceEngine {
  private layers = new Map<MoodId, Layer>();
  private current: MoodId | null = null;
  private pref: AmbiencePref = readAmbiencePref();
  /** Ambience only ever starts from the "enter bethak" gesture. */
  private started = false;
  private listeners = new Set<(p: AmbiencePref) => void>();

  getPref(): AmbiencePref {
    return { ...this.pref };
  }

  subscribe(fn: (p: AmbiencePref) => void) {
    this.listeners.add(fn);
    fn(this.getPref());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    const p = this.getPref();
    writeAmbiencePref(p);
    this.listeners.forEach((l) => l(p));
  }

  /** Lazily creates the element for a mood — nothing loads before it is used. */
  private layerFor(mood: MoodId): Layer | null {
    if (typeof window === "undefined") return null;
    const existing = this.layers.get(mood);
    if (existing) return existing;
    const file = sessionFor(mood).ambience;
    if (!file) return null;

    const el = document.createElement("audio");
    el.loop = true;
    el.preload = "auto";
    el.volume = 0;
    (el as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    AMBIENCE_FORMATS.forEach((ext) => {
      const source = document.createElement("source");
      source.src = `${base()}ambience/${file}.${ext}`;
      source.type = ext === "mp3" ? "audio/mpeg" : "audio/ogg";
      el.appendChild(source);
    });
    // A missing file must never surface: stay quiet.
    el.addEventListener("error", () => {}, true);
    const layer: Layer = { el, gain: 0, fade: null };
    this.layers.set(mood, layer);
    return layer;
  }

  private target(mood: MoodId) {
    if (!this.pref.enabled || !this.started) return 0;
    return Math.max(0, Math.min(1, this.pref.volume * sessionFor(mood).ambienceGain));
  }

  private fadeTo(mood: MoodId, to: number, ms: number) {
    const layer = this.layerFor(mood);
    if (!layer) return;
    if (layer.fade) clearInterval(layer.fade);
    const from = layer.gain;
    const steps = Math.max(1, Math.round(ms / STEP_MS));
    let i = 0;

    if (to > 0) {
      const p = layer.el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    layer.fade = setInterval(() => {
      i += 1;
      const v = from + (to - from) * (i / steps);
      layer.gain = v;
      try {
        layer.el.volume = Math.max(0, Math.min(1, v));
      } catch {
        /* ignore */
      }
      if (i >= steps) {
        if (layer.fade) clearInterval(layer.fade);
        layer.fade = null;
        layer.gain = to;
        if (to === 0) {
          try {
            layer.el.pause();
          } catch {
            /* ignore */
          }
        }
      }
    }, STEP_MS);
  }

  /** Called from the "बैठक में आइए" gesture, alongside the music. */
  start(mood: MoodId) {
    this.started = true;
    this.setMood(mood, CROSSFADE_MS);
  }

  /** Mood change: old ambience out, new ambience in — music untouched. */
  setMood(mood: MoodId, ms = CROSSFADE_MS) {
    const previous = this.current;
    this.current = mood;
    if (previous && previous !== mood) this.fadeTo(previous, 0, ms);
    this.fadeTo(mood, this.target(mood), ms);
  }

  setEnabled(on: boolean) {
    this.pref = { ...this.pref, enabled: on };
    this.emit();
    if (this.current) this.setMood(this.current, 600);
  }

  setVolume(v: number) {
    this.pref = { ...this.pref, volume: Math.max(0, Math.min(1, v)) };
    this.emit();
    if (this.current) this.fadeTo(this.current, this.target(this.current), 200);
  }

  /** Leaving the room: stop cleanly. */
  stop() {
    this.started = false;
    this.layers.forEach((layer) => {
      if (layer.fade) clearInterval(layer.fade);
      layer.fade = null;
      layer.gain = 0;
      try {
        layer.el.pause();
        layer.el.volume = 0;
      } catch {
        /* ignore */
      }
    });
  }

  /**
   * The page went to the background: cut the room sound at once and disarm
   * the engine, so nothing can start again by itself when the visitor
   * returns — only an explicit gesture may call start() again.
   */
  suspend() {
    this.stop();
  }

}

let singleton: AmbienceEngine | null = null;
export function getAmbienceEngine() {
  if (!singleton) singleton = new AmbienceEngine();
  return singleton;
}
