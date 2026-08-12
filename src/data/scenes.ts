/**
 * Ambient background scenes for BETHAK.
 *
 * The video files live in `public/scenes/` so they are served as plain static
 * files (works on Lovable hosting and on GitHub Pages under a repo subpath —
 * URLs are prefixed with import.meta.env.BASE_URL at runtime).
 */

export type MoodId = "raat" | "baarish" | "shaam" | "yaadein";

export type Scene = {
  id: MoodId;
  /** Short label shown in the mood selector. */
  label: string;
  /** Full name of the bethak. */
  name: string;
  /** File name inside public/scenes (video + poster share the base name). */
  file: string;
  /**
   * Portrait-only camera. Desktop framing is never affected.
   * x/y = focal point inside the 16:9 frame, zoom = width in viewport widths.
   */
  mobile?: { x: string; y: string };
};

export const SCENES: Scene[] = [
  // Window + moon are around x 0.62 in every scene; the sofa/chai sit left of
  // it, so the portrait focal point sits between them and leans window-ward.
  { id: "raat", label: "रात", name: "Raat Ki Bethak", file: "Default_theme", mobile: { x: "67%", y: "45%" } },
  { id: "baarish", label: "बारिश", name: "Baarish Ki Bethak", file: "rainly_scene", mobile: { x: "68%", y: "44%" } },
  { id: "shaam", label: "शाम", name: "Shaam Ki Bethak", file: "sunset_scene", mobile: { x: "67%", y: "45%" } },
  { id: "yaadein", label: "यादें", name: "Yaadon Ki Bethak", file: "ideal_1", mobile: { x: "65%", y: "46%" } },
];

export const DEFAULT_MOOD: MoodId = "raat";

const base = () => import.meta.env.BASE_URL || "/";

export const videoUrl = (s: Scene) => `${base()}scenes/${s.file}.mp4`;
export const posterUrl = (s: Scene) => `${base()}scenes/${s.file}.jpg`;
export const sceneById = (id: MoodId) => SCENES.find((s) => s.id === id) ?? SCENES[0];
