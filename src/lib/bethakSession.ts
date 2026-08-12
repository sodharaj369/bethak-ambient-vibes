/**
 * Lightweight local session memory for Bethak: which mood the room was in,
 * which song was playing and roughly where. Silent — never surfaced as UI.
 */
export type BethakSession = {
  mood?: string;
  trackId?: string;
  index?: number;
  position?: number;
  updatedAt: number;
};

const KEY = "bethakSession";
/** Playback position is only resumed inside this window. */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function readSession(): BethakSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BethakSession;
    if (!parsed || typeof parsed.updatedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(patch: Partial<BethakSession>) {
  if (typeof window === "undefined") return;
  try {
    const current = readSession() ?? { updatedAt: 0 };
    const next: BethakSession = { ...current, ...patch, updatedAt: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked — memory is a nicety, not a requirement */
  }
}

export function isFresh(session: BethakSession | null): boolean {
  return !!session && Date.now() - session.updatedAt < SESSION_TTL_MS;
}
