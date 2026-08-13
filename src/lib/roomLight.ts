import type { MoodId } from "@/data/scenes";

/** The four lighting states of the bethak. AUTO follows the mood. */
export type LightMode = "auto" | "warm" | "dim" | "candle";

export const LIGHT_MODES: LightMode[] = ["auto", "warm", "dim", "candle"];

export const LIGHT_LABEL: Record<LightMode, string> = {
  auto: "Auto",
  warm: "Warm",
  dim: "Dim",
  candle: "Candle",
};

export const LIGHT_KEY = "bethakLightMode";

/** Atmospheric strength per mood when the room lights itself (AUTO). */
export const AUTO_LEVEL: Record<MoodId, number> = {
  raat: 0.45,
  baarish: 0.4,
  shaam: 0.65,
  yaadein: 0.3,
};

export function nextLightMode(mode: LightMode): LightMode {
  return LIGHT_MODES[(LIGHT_MODES.indexOf(mode) + 1) % LIGHT_MODES.length];
}

export function readLightMode(): LightMode {
  try {
    const v = window.localStorage.getItem(LIGHT_KEY);
    if (v && (LIGHT_MODES as string[]).includes(v)) return v as LightMode;
  } catch {
    /* storage blocked */
  }
  return "auto";
}

export function writeLightMode(mode: LightMode) {
  try {
    window.localStorage.setItem(LIGHT_KEY, mode);
  } catch {
    /* storage blocked */
  }
}

/** Opacity of the three atmospheric layers for a given mode + mood. */
export function lightWeights(mode: LightMode, mood: MoodId) {
  const level = AUTO_LEVEL[mood] ?? 0.45;
  switch (mode) {
    case "warm":
      return { dim: 0.1, warm: 0.7, candle: 0 };
    case "dim":
      return { dim: 0.6, warm: 0.14, candle: 0 };
    case "candle":
      return { dim: 0.5, warm: 0.38, candle: 1 };
    case "auto":
    default:
      return { dim: level * 0.45, warm: level * 0.34, candle: 0 };
  }
}
