/**
 * A single ceramic clink — lazily created on the first chai tap.
 *
 * Completely independent of the ghazal and of the ambience engine: its own
 * element, its own (very quiet) volume. If the file is missing the tap simply
 * stays silent — never an error, never a UI state.
 */
const CHAI_SRC = () => `${import.meta.env.BASE_URL || "/"}ambience/chai-cup.mp3`;
const CHAI_VOLUME = 0.22;

let el: HTMLAudioElement | null = null;

export function playChaiSound() {
  if (typeof window === "undefined") return;
  try {
    if (!el) {
      el = new Audio(CHAI_SRC());
      el.preload = "auto";
      el.volume = CHAI_VOLUME;
      el.addEventListener("error", () => {}, true);
    }
    el.currentTime = 0;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {
    /* missing file or blocked playback — stay quiet */
  }
}
