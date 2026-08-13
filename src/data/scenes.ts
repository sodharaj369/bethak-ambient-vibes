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
  /**
   * The chai cups inside the 16:9 frame (percentages of the frame, so the
   * hotspot follows the illustration at every viewport size). `w`/`h` are the
   * invisible hit area; the mobile pair is a larger, thumb-friendly version.
   */
  chai?: {
    x: string;
    y: string;
    w: string;
    h: string;
    mobile?: { x?: string; y?: string; w: string; h: string };
  };
  /**
   * The lamp / candle inside the 16:9 frame — where the room's warm light
   * lives. Used by the atmospheric light layer, which sits inside the same
   * room frame and therefore pans with the room.
   */
  light?: { x: string; y: string; mobile?: { x?: string; y?: string } };
  /** The harmonium, in the same frame-relative coordinates as `chai`. */
  harmonium?: {
    x: string;
    y: string;
    w: string;
    h: string;
    mobile?: { x?: string; y?: string; w: string; h: string };
  };
};

export const SCENES: Scene[] = [
  // Window + moon are around x 0.62 in every scene; the sofa/chai sit left of
  // it, so the portrait focal point sits between them and leans window-ward.
  {
    id: "raat",
    light: { x: "85%", y: "44%" },
    label: "रात",
    name: "Raat Ki Bethak",
    file: "Default_theme",
    mobile: { x: "67%", y: "45%" },
    chai: { x: "53.5%", y: "76%", w: "11%", h: "13%", mobile: { w: "17%", h: "18%" } },
    harmonium: { x: "80.5%", y: "71%", w: "18%", h: "17%", mobile: { x: "78%", w: "22%", h: "20%" } },
  },
  {
    id: "baarish",
    light: { x: "85%", y: "45%" },
    label: "बारिश",
    name: "Baarish Ki Bethak",
    file: "rainly_scene",
    mobile: { x: "60%", y: "44%" },
    chai: { x: "53%", y: "76.5%", w: "11%", h: "13%", mobile: { w: "17%", h: "18%" } },
    harmonium: { x: "81%", y: "71%", w: "18%", h: "17%", mobile: { x: "78%", w: "22%", h: "20%" } },
  },
  {
    id: "shaam",
    light: { x: "68%", y: "40%" },
    label: "शाम",
    name: "Shaam Ki Bethak",
    file: "sunset_scene",
    mobile: { x: "67%", y: "45%" },
    chai: { x: "53.5%", y: "77%", w: "11%", h: "13%", mobile: { w: "17%", h: "18%" } },
    harmonium: { x: "81%", y: "72%", w: "18%", h: "17%", mobile: { x: "78%", w: "22%", h: "20%" } },
  },
  {
    id: "yaadein",
    light: { x: "85%", y: "44%" },
    label: "यादें",
    name: "Yaadon Ki Bethak",
    file: "ideal_1",
    mobile: { x: "65%", y: "46%" },
    chai: { x: "53%", y: "77%", w: "11%", h: "13%", mobile: { w: "17%", h: "18%" } },
    harmonium: { x: "81%", y: "72.5%", w: "18%", h: "17%", mobile: { x: "78%", w: "22%", h: "20%" } },
  },
];

export const DEFAULT_MOOD: MoodId = "raat";

const base = () => import.meta.env.BASE_URL || "/";

export const videoUrl = (s: Scene) => `${base()}scenes/${s.file}.mp4`;
export const posterUrl = (s: Scene) => `${base()}scenes/${s.file}.jpg`;
export const sceneById = (id: MoodId) => SCENES.find((s) => s.id === id) ?? SCENES[0];
