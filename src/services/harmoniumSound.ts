/**
 * One soft harmonium note — playable any number of times.
 *
 * Every tap must sound, so a single shared <audio> element is NOT used:
 * restarting one element mid-playback (currentTime = 0) can throw or be
 * ignored on iOS/Safari, which made the second and later taps silent.
 *
 * Preferred path: decode the file once with WebAudio and start a fresh
 * source node per tap. Fallback: a small pool of cloned <audio> elements.
 * Its own quiet volume, completely independent of ghazal + ambience.
 */
const HARMONIUM_SRC = () => `${import.meta.env.BASE_URL || "/"}ambience/harmonium-note.mp3`;
const HARMONIUM_VOLUME = 0.18;

let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let decoding: Promise<void> | null = null;

/** Fallback pool — used if WebAudio is unavailable or decoding fails. */
const pool: HTMLAudioElement[] = [];
let poolIndex = 0;

function playFromPool() {
  try {
    if (pool.length === 0) {
      for (let i = 0; i < 4; i++) {
        const a = new Audio(HARMONIUM_SRC());
        a.preload = "auto";
        a.volume = HARMONIUM_VOLUME;
        a.addEventListener("error", () => {}, true);
        pool.push(a);
      }
    }
    const el = pool[poolIndex % pool.length]!;
    poolIndex++;
    try {
      el.currentTime = 0;
    } catch {
      /* not seekable yet — let it play from wherever it is */
    }
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {
    /* missing file or blocked playback — stay quiet */
  }
}

function ensureBuffer() {
  if (buffer || decoding) return;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  try {
    ctx = ctx ?? new AC();
  } catch {
    ctx = null;
    return;
  }
  decoding = fetch(HARMONIUM_SRC())
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error("missing"))))
    .then((buf) => ctx!.decodeAudioData(buf))
    .then((decoded) => {
      buffer = decoded;
    })
    .catch(() => {
      buffer = null;
    });
}

export function preloadHarmoniumNote() {
  if (typeof window === "undefined") return;
  ensureBuffer();
}

export function playHarmoniumNote() {
  if (typeof window === "undefined") return;
  ensureBuffer();

  if (ctx && buffer) {
    try {
      if (ctx.state === "suspended") void ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = HARMONIUM_VOLUME;
      src.connect(gain).connect(ctx.destination);
      src.start();
      return;
    } catch {
      /* fall through to the element pool */
    }
  }

  playFromPool();
}

/** Page went to the background: silence any ringing note immediately. */
export function stopHarmoniumNotes() {
  try {
    pool.forEach((a) => {
      a.pause();
      try {
        a.currentTime = 0;
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* ignore */
  }
  try {
    if (ctx && ctx.state === "running") void ctx.suspend();
  } catch {
    /* ignore */
  }
}
