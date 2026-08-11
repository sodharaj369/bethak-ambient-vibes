import { bethakPlaylist, type MusicTrack } from "@/data/playlist";

/**
 * Playback abstraction. The only implementation today is HtmlAudioEngine,
 * which drives a real <audio> element. Playback is a no-op until a track
 * carries an authorized `audioUrl` — nothing is ever simulated.
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

export type PlayerState = {
  index: number;
  track: MusicTrack;
  isPlaying: boolean;
  position: number;
  duration: number;
  /** False when the current track has no authorized audio source. */
  canPlay: boolean;
};

export class HtmlAudioEngine implements MusicEngine {
  private tracks: MusicTrack[];
  private index = 0;
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<(s: PlayerState) => void>();

  constructor(tracks: MusicTrack[] = bethakPlaylist) {
    this.tracks = tracks;
    if (typeof window !== "undefined" && typeof Audio !== "undefined") {
      this.audio = new Audio();
      this.audio.preload = "metadata";
      const emit = () => this.emit();
      this.audio.addEventListener("timeupdate", emit);
      this.audio.addEventListener("durationchange", emit);
      this.audio.addEventListener("loadedmetadata", emit);
      this.audio.addEventListener("play", emit);
      this.audio.addEventListener("pause", emit);
      this.audio.addEventListener("error", emit);
      this.audio.addEventListener("ended", () => this.next());
      this.load();
    }
  }

  private load(autoplay = false) {
    const audio = this.audio;
    if (!audio) return;
    const url = this.getCurrentTrack().audioUrl;
    if (!url) {
      audio.removeAttribute("src");
      audio.load();
      this.emit();
      return;
    }
    audio.src = url;
    audio.load();
    if (autoplay) void audio.play().catch(() => this.emit());
    this.emit();
  }

  getCurrentTrack(): MusicTrack {
    return this.tracks[this.index] as MusicTrack;
  }

  getCurrentTime(): number {
    return this.audio?.currentTime ?? 0;
  }

  getDuration(): number {
    const d = this.audio?.duration;
    return Number.isFinite(d) && d ? (d as number) : this.getCurrentTrack().duration;
  }

  getState(): PlayerState {
    return {
      index: this.index,
      track: this.getCurrentTrack(),
      isPlaying: !!this.audio && !this.audio.paused && !!this.getCurrentTrack().audioUrl,
      position: this.getCurrentTime(),
      duration: this.getDuration(),
      canPlay: !!this.getCurrentTrack().audioUrl,
    };
  }

  private emit() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  subscribe(listener: (s: PlayerState) => void) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  async play() {
    if (!this.audio || !this.getCurrentTrack().audioUrl) {
      // No authorized source: stay honestly paused.
      this.emit();
      return;
    }
    try {
      await this.audio.play();
    } catch {
      /* autoplay blocked or source unavailable */
    }
    this.emit();
  }

  pause() {
    this.audio?.pause();
    this.emit();
  }

  next() {
    const wasPlaying = this.getState().isPlaying;
    this.index = (this.index + 1) % this.tracks.length;
    this.load(wasPlaying);
  }

  previous() {
    const wasPlaying = this.getState().isPlaying;
    if (this.getCurrentTime() > 3) {
      this.seek(0);
      return;
    }
    this.index = (this.index - 1 + this.tracks.length) % this.tracks.length;
    this.load(wasPlaying);
  }

  seek(seconds: number) {
    if (!this.audio || !this.getCurrentTrack().audioUrl) return;
    this.audio.currentTime = Math.max(0, Math.min(seconds, this.getDuration()));
    this.emit();
  }

  dispose() {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio = null;
    }
    this.listeners.clear();
  }
}
