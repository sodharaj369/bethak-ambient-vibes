import { bethakPlaylist, type MusicTrack } from "@/data/playlist";

/**
 * Playback abstraction. The only implementation is YouTubeEngine, which drives a
 * real YouTube IFrame Player. Nothing about progress or state is simulated —
 * every value comes from the live player.
 */
export interface MusicEngine {
  play(): Promise<void>;
  pause(): void;
  next(): void;
  previous(): void;
  seek(seconds: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getCurrentTrack(): MusicTrack;
  getState(): PlayerState;
  subscribe(listener: (state: PlayerState) => void): () => void;
  dispose(): void;
}

export type RepeatMode = "off" | "playlist" | "song";

export type PlayerState = {
  index: number;
  track: MusicTrack;
  isPlaying: boolean;
  position: number;
  duration: number;
  /** False until the YouTube player is ready. */
  canPlay: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
};


type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  loadVideoById(id: string): void;
  cueVideoById(id: string): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  setVolume(volume: number): void;
  getVolume(): number;
  destroy(): void;
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<any> | null = null;

/** Loads the official YouTube IFrame Player API exactly once. */
function loadYouTubeApi(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return apiPromise;
}

const EMPTY_TRACK: MusicTrack = {
  id: "empty",
  title: "No tracks configured",
  artist: "Add songs in src/data/bethakPlaylist.ts",
  youtubeId: "",
  youtubeUrl: "",
  artworkCandidates: [],
};

export class YouTubeEngine implements MusicEngine {
  private tracks: MusicTrack[];
  private index = 0;
  private player: YTPlayer | null = null;
  private ready = false;
  private playing = false;
  private wantPlay = false;
  private listeners = new Set<(s: PlayerState) => void>();
  /** Last handed-out state object; reused while nothing actually changed. */
  private snapshot: PlayerState | null = null;
  /** Last state pushed to listeners, so no-op ticks stay silent. */
  private emitted: PlayerState | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;

  /** True between loading a track and the player reporting the new one. */
  private settling = false;
  private errorStreak = 0;
  private disposed = false;
  private shuffle = false;
  private repeatMode: RepeatMode = "off";
  /** Playback sequence of playlist indices; identity unless shuffling. */
  private order: number[] = [];
  private cursor = 0;
  /** Position to apply as soon as the loaded/cued video is addressable. */
  private pendingSeek: number | null = null;
  /**
   * Audio gate. Nothing may sound before the visitor has actually stepped into
   * the bethak — a saved session, a ready player or a mounted component are all
   * data, never permission.
   */
  private entered = false;
  /** Invalidates in-flight volume fades when playback is suspended. */
  private fadeToken = 0;


  constructor(hostId: string, tracks: MusicTrack[] = bethakPlaylist) {
    this.tracks = tracks;
    if (typeof window === "undefined") return;
    // No valid tracks configured: stay inert rather than crash.
    if (this.tracks.length === 0) return;
    void loadYouTubeApi().then((YT) => {
      if (this.disposed || !YT?.Player) return;
      this.player = new YT.Player(hostId, {
        width: 200,
        height: 200,
        videoId: this.getCurrentTrack().youtubeId,
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            this.ready = true;
            if (this.wantPlay && this.entered) this.player?.playVideo();
            this.emit();
          },
          onStateChange: (e: { data: number }) => {
            // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (e.data === 0) {
              this.handleEnded();
              return;
            }
            if (e.data === 1 || e.data === 5) this.settling = false;
            if (e.data === 1) this.errorStreak = 0;
            if (e.data === 1 || e.data === 2) this.playing = e.data === 1;
            this.applyPendingSeek();
            this.emit();
          },

          onError: () => {
            // Unplayable video (embedding/region/deleted): never pretend it plays.
            this.playing = false;
            this.emit();
            this.errorStreak += 1;
            if (this.errorStreak < this.tracks.length) this.next();
          },
        },
      }) as YTPlayer;
    });
    // Reads live player time — no simulated progress. A silent room does not
    // need four re-renders a second: the ticker only runs while something is
    // actually moving; every other change still emits on its own event.
    this.ticker = setInterval(() => {
      if (!this.ready) return;
      this.applyPendingSeek();
      if (!this.playing && this.pendingSeek == null) return;
      this.emit();
    }, 250);
  }

  /** The one user gesture that unlocks sound. */
  markEntered() {
    if (this.entered) return;
    this.entered = true;
    this.applyPendingSeek();
  }

  /** Back to the landing state: silence, without losing the sitting. */
  leave() {
    this.entered = false;
    this.wantPlay = false;
    this.playing = false;
    try {
      this.player?.pauseVideo();
    } catch {
      /* player not addressable */
    }
    this.emit();
  }

  /**
   * The tab went to the background: pause hard and cancel any pending intent
   * to play, so neither a ready event, a remount nor a returning pageshow can
   * resume the ghazal on its own. The sitting (track + position) is kept.
   */
  suspend() {
    this.wantPlay = false;
    this.playing = false;
    // Any fade-in still in flight would keep calling play(): the gate below
    // makes those calls inert until the visitor asks again.
    this.fadeToken += 1;
    try {
      this.player?.pauseVideo();
    } catch {
      /* player not addressable */
    }
    this.emit();
  }



  /** Enter the room: start playing with the volume rising gently from silence. */
  async fadeIn(durationMs = 700, target = 100) {
    if (!this.entered) return;
    const token = (this.fadeToken += 1);
    const steps = 14;
    try {
      this.player?.setVolume(0);
    } catch {
      /* player not addressable yet */
    }
    await this.play();
    for (let i = 1; i <= steps; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, durationMs / steps));
      if (token !== this.fadeToken) return;
      const eased = Math.pow(i / steps, 1.6) * target;
      try {
        this.player?.setVolume(Math.round(eased));
      } catch {
        /* ignore */
      }
    }
  }

  getCurrentTrack(): MusicTrack {
    return (this.tracks[this.index] ?? EMPTY_TRACK) as MusicTrack;
  }

  /** Applies a restored position once the player can actually seek. */
  private applyPendingSeek() {
    // Seeking a cued video makes YouTube start playing, so a restored position
    // waits until entry.
    if (this.pendingSeek == null || !this.player || !this.entered) return;
    const d = this.player.getDuration();
    if (!Number.isFinite(d) || d <= 0) return;
    const target = Math.max(0, Math.min(this.pendingSeek, d - 2));
    this.pendingSeek = null;
    this.settling = false;
    try {
      this.player.seekTo(target, true);
    } catch {
      /* ignore */
    }
  }

  /**
   * Silently restores a previous sitting: cue the same song at roughly the same
   * place, paused. No autoplay, no prompt.
   */
  restoreSession(index: number, position: number) {
    if (index < 0 || index >= this.tracks.length) return;
    if (this.playing || this.wantPlay) return;
    this.index = index;
    this.ensureOrder();
    this.cursor = Math.max(0, this.order.indexOf(index));
    this.load(false);
    this.pendingSeek = position > 5 ? position : null;
    if (this.ready) this.applyPendingSeek();
  }



  /** Clears the post-load guard as soon as the player reports the new video. */
  private checkSettled() {
    if (!this.settling || !this.player) return;
    const d = this.player.getDuration();
    const t = this.player.getCurrentTime();
    if (Number.isFinite(d) && d > 0 && Number.isFinite(t) && t < 2) this.settling = false;
  }

  getCurrentTime(): number {
    this.checkSettled();
    if (!this.ready || !this.player || this.settling) return 0;
    const t = this.player.getCurrentTime();
    return Number.isFinite(t) ? t : 0;
  }

  getDuration(): number {
    this.checkSettled();
    if (!this.ready || !this.player || this.settling) return 0;
    const d = this.player.getDuration();
    return Number.isFinite(d) ? d : 0;
  }

  /**
   * The snapshot React reads. It is a pure getter: it never polls the YouTube
   * player, so calling it twice in the same render always returns the very same
   * object. Only `refresh()` — driven by the ticker and by real player events —
   * may produce a new one.
   */
  getState(): PlayerState {
    return this.snapshot ?? this.refresh();
  }

  /** Re-reads the live player and swaps the snapshot only if it truly moved. */
  private refresh(): PlayerState {
    const next: PlayerState = {
      index: this.index,
      track: this.getCurrentTrack(),
      isPlaying: this.playing,
      position: this.getCurrentTime(),
      duration: this.getDuration(),
      canPlay: this.ready,
      shuffle: this.shuffle,
      repeatMode: this.repeatMode,
    };
    const prev = this.snapshot;
    if (
      prev &&
      prev.index === next.index &&
      prev.track === next.track &&
      prev.isPlaying === next.isPlaying &&
      // A quarter second is what the progress bar can show; finer float
      // jitter must not become a React update.
      Math.abs(prev.position - next.position) < 0.2 &&
      Math.abs(prev.duration - next.duration) < 0.2 &&
      prev.canPlay === next.canPlay &&
      prev.shuffle === next.shuffle &&
      prev.repeatMode === next.repeatMode
    ) {
      return prev;
    }
    this.snapshot = next;
    return next;
  }

  private emit() {
    const s = this.refresh();
    if (s === this.emitted) return;
    this.emitted = s;
    if (import.meta.env.DEV) {
      const target = window as Window & {
        __bethakEngineTrace?: Array<{
          at: number;
          index: number;
          playing: boolean;
          position: number;
          duration: number;
          listeners: number;
          stack: string;
        }>;
      };
      const trace = (target.__bethakEngineTrace ??= []);
      trace.push({
        at: performance.now(),
        index: s.index,
        playing: s.isPlaying,
        position: s.position,
        duration: s.duration,
        listeners: this.listeners.size,
        stack: new Error().stack ?? "",
      });
      if (trace.length > 500) trace.shift();
    }
    this.listeners.forEach((l) => l(s));
  }


  /** Subscription for useSyncExternalStore: the store is read, never pushed. */
  subscribe(listener: (s: PlayerState) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }


  async play() {
    if (!this.entered) return;
    this.wantPlay = true;
    if (this.ready) this.player?.playVideo();
    this.emit();
  }

  pause() {
    this.wantPlay = false;
    if (this.ready) this.player?.pauseVideo();
    this.emit();
  }

  private load(autoplayRequested: boolean) {
    const autoplay = autoplayRequested && this.entered;
    this.pendingSeek = null;
    const id = this.getCurrentTrack().youtubeId;
    this.wantPlay = autoplay;
    this.settling = true;
    this.playing = false;
    if (!this.ready || !this.player) return this.emit();
    if (autoplay) this.player.loadVideoById(id);
    else this.player.cueVideoById(id);
    this.emit();
  }

  /** Rebuilds the playback sequence. Never mutates the source playlist. */
  private buildOrder(startAt: number) {
    const n = this.tracks.length;
    const rest = Array.from({ length: n }, (_, i) => i).filter((i) => i !== startAt);
    if (this.shuffle) {
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j]!, rest[i]!];
      }
      this.order = [startAt, ...rest];
      this.cursor = 0;
    } else {
      this.order = Array.from({ length: n }, (_, i) => i);
      this.cursor = Math.max(0, this.order.indexOf(startAt));
    }
  }

  private ensureOrder() {
    if (this.order.length !== this.tracks.length) this.buildOrder(this.index);
  }

  setShuffle(on: boolean) {
    this.shuffle = on;
    this.buildOrder(this.index);
    this.emit();
  }

  setRepeatMode(mode: RepeatMode) {
    this.repeatMode = mode;
    this.emit();
  }

  cycleRepeat() {
    this.repeatMode =
      this.repeatMode === "off" ? "playlist" : this.repeatMode === "playlist" ? "song" : "off";
    this.emit();
  }

  /** Single central decision point for what happens when a track ends. */
  private handleEnded() {
    if (this.repeatMode === "song") {
      this.load(true);
      return;
    }
    this.next();
  }

  getTracks(): MusicTrack[] {
    return this.tracks;
  }

  /** Plays a specific playlist index (playlist panel selection). */
  playAt(index: number) {
    if (index < 0 || index >= this.tracks.length) return;
    this.index = index;
    if (this.shuffle) {
      // Keep the shuffled sequence, but continue from the chosen track.
      const at = this.order.indexOf(index);
      if (at >= 0) this.cursor = at;
      else this.buildOrder(index);
    } else {
      this.ensureOrder();
      this.cursor = this.order.indexOf(index);
    }
    this.load(true);
  }

  next() {
    const wasPlaying = this.playing || this.wantPlay;
    this.ensureOrder();
    if (this.cursor < this.order.length - 1) {
      this.cursor += 1;
    } else if (this.repeatMode !== "off") {
      if (this.shuffle) {
        // New sequence, avoiding restarting on the track that just ended.
        const others = this.order.filter((i) => i !== this.index);
        const start = others.length ? others[Math.floor(Math.random() * others.length)]! : this.index;
        this.buildOrder(start);
        this.cursor = 0;
      } else {
        this.cursor = 0;
      }
    } else {
      // End of the sitting: stop rather than loop.
      this.pause();
      return;
    }
    this.index = this.order[this.cursor] ?? 0;
    this.load(wasPlaying);
  }

  previous() {
    const wasPlaying = this.playing || this.wantPlay;
    if (this.getCurrentTime() > 3) {
      this.seek(0);
      return;
    }
    this.ensureOrder();
    this.cursor = this.cursor > 0 ? this.cursor - 1 : this.order.length - 1;
    this.index = this.order[this.cursor] ?? 0;
    this.load(wasPlaying);
  }


  seek(seconds: number) {
    if (!this.ready || !this.player || this.settling) return;
    const d = this.getDuration();
    this.player.seekTo(Math.max(0, d ? Math.min(seconds, d) : seconds), true);
    this.emit();
  }

  /**
   * Swap the sitting's song list (mood change). The current song keeps playing
   * if it belongs to the new session; otherwise the new session starts from its
   * first song, matching whatever the player was doing.
   */
  setTracks(tracks: MusicTrack[]) {
    if (tracks.length === 0) return;
    const currentId = this.getCurrentTrack().id;
    const sameList =
      tracks.length === this.tracks.length &&
      tracks.every((t, i) => t.id === this.tracks[i]?.id);
    if (sameList) return;
    const wasPlaying = this.playing || this.wantPlay;
    this.tracks = tracks;
    const keep = tracks.findIndex((t) => t.id === currentId);
    this.index = keep >= 0 ? keep : 0;
    this.buildOrder(this.index);
    // Only reload when the song itself has to change — never interrupt a
    // ghazal that also lives in the newly chosen bethak.
    if (keep < 0) this.load(wasPlaying);
    else this.emit();
  }

  dispose() {
    this.disposed = true;
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
    try {
      this.player?.destroy();
    } catch {
      /* player already gone */
    }
    this.player = null;
    this.listeners.clear();
  }
}

/**
 * One engine per page. React can construct components twice in development;
 * a second YouTube player on the same host element would leave the UI bound to
 * a stale, non-playing player object.
 */
let singleton: YouTubeEngine | null = null;
export function getYouTubeEngine(hostId: string, tracks: MusicTrack[] = bethakPlaylist) {
  if (!singleton) singleton = new YouTubeEngine(hostId, tracks);
  return singleton;
}
