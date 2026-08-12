/**
 * One soft harmonium note — lazily created on the first tap.
 *
 * Same rules as the chai clink: its own element, its own very quiet volume,
 * completely independent of the ghazal and the ambience. A missing file or a
 * blocked play() simply means silence — never an error, never a UI state.
 */
const HARMONIUM_SRC = () => `${import.meta.env.BASE_URL || "/"}ambience/harmonium-note.mp3`;
const HARMONIUM_VOLUME = 0.18;

let el: HTMLAudioElement | null = null;

export function playHarmoniumNote() {
  if (typeof window === "undefined") return;
  try {
    if (!el) {
      el = new Audio(HARMONIUM_SRC());
      el.preload = "auto";
      el.volume = HARMONIUM_VOLUME;
      el.addEventListener("error", () => {}, true);
    }
    el.currentTime = 0;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {
    /* missing file or blocked playback — stay quiet */
  }
}
