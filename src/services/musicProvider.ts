import { bethakPlaylist, type Track } from "@/data/playlist";

/**
 * Abstract playback layer. Swap MockMusicProvider for a Spotify / YouTube
 * backed implementation later without touching the UI.
 */
export interface MusicProvider {
  play(): void;
  pause(): void;
  next(): void;
  previous(): void;
  seek(seconds: number): void;
  getCurrentTrack(): Track;
  getState(): PlayerState;
  subscribe(listener: (state: PlayerState) => void): () => void;
}

export type PlayerState = {
  index: number;
  track: Track;
  isPlaying: boolean;
  position: number;
  duration: number;
};

export class MockMusicProvider implements MusicProvider {
  private tracks: Track[];
  private index = 0;
  private isPlaying = false;
  private position = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<(s: PlayerState) => void>();

  constructor(tracks: Track[] = bethakPlaylist) {
    this.tracks = tracks;
  }

  getCurrentTrack() {
    return this.tracks[this.index];
  }

  getState(): PlayerState {
    return {
      index: this.index,
      track: this.getCurrentTrack(),
      isPlaying: this.isPlaying,
      position: this.position,
      duration: this.getCurrentTrack().duration,
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

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.timer = setInterval(() => {
      this.position += 0.25;
      if (this.position >= this.getCurrentTrack().duration) {
        this.position = 0;
        this.index = (this.index + 1) % this.tracks.length;
      }
      this.emit();
    }, 250);
    this.emit();
  }

  pause() {
    this.isPlaying = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.emit();
  }

  next() {
    this.index = (this.index + 1) % this.tracks.length;
    this.position = 0;
    this.emit();
  }

  previous() {
    if (this.position > 3) {
      this.position = 0;
    } else {
      this.index = (this.index - 1 + this.tracks.length) % this.tracks.length;
      this.position = 0;
    }
    this.emit();
  }

  seek(seconds: number) {
    this.position = Math.max(0, Math.min(seconds, this.getCurrentTrack().duration));
    this.emit();
  }

  dispose() {
    if (this.timer) clearInterval(this.timer);
    this.listeners.clear();
  }
}
