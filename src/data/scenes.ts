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
};

export const SCENES: Scene[] = [
  { id: "raat", label: "रात", name: "Raat Ki Bethak", file: "Default_theme" },
  { id: "baarish", label: "बारिश", name: "Baarish Ki Bethak", file: "rainly_scene" },
  { id: "shaam", label: "शाम", name: "Shaam Ki Bethak", file: "sunset_scene" },
  { id: "yaadein", label: "यादें", name: "Yaadon Ki Bethak", file: "ideal_1" },
];

export const DEFAULT_MOOD: MoodId = "raat";

const base = () => import.meta.env.BASE_URL || "/";

export const videoUrl = (s: Scene) => `${base()}scenes/${s.file}.mp4`;
export const posterUrl = (s: Scene) => `${base()}scenes/${s.file}.jpg`;
export const sceneById = (id: MoodId) => SCENES.find((s) => s.id === id) ?? SCENES[0];
