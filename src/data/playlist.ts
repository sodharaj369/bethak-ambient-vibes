export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  /** YouTube video ID — the real playback source and the artwork source. */
  youtubeId: string;
  /** Canonical watch URL, for attribution / external links. */
  youtubeUrl: string;
  /** Thumbnail candidates, best first. Derived — never hardcoded per track. */
  artworkCandidates: string[];
};

/** Backwards-compatible alias. */
export type Track = MusicTrack;

/**
 * Add tracks here — one line each. id, url and artwork are derived.
 * Scales to 20–30 tracks without touching any other file.
 */
type Seed = { title: string; artist: string; youtubeId: string };

const seeds: Seed[] = [
  { title: "Hothon Se Chhu Lo Tum", artist: "Jagjit Singh", youtubeId: "X0gB9jcgXxg" },
  { title: "Tum Ko Dekha To Yeh Khayal Aaya", artist: "Jagjit Singh", youtubeId: "WtPbNKk9XpU" },
  { title: "Jhuki Jhuki Si Nazar", artist: "Jagjit Singh", youtubeId: "xY2P6IAd0MI" },
];

export const thumbnailCandidates = (youtubeId: string) => [
  `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
  `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
  `https://img.youtube.com/vi/${youtubeId}/default.jpg`,
];

export const bethakPlaylist: MusicTrack[] = seeds.map((s, i) => ({
  id: `track-${i + 1}`,
  title: s.title,
  artist: s.artist,
  youtubeId: s.youtubeId,
  youtubeUrl: `https://www.youtube.com/watch?v=${s.youtubeId}`,
  artworkCandidates: thumbnailCandidates(s.youtubeId),
}));

export const EXTERNAL_LINKS = {
  spotify: "https://open.spotify.com/",
  youtubeMusic: "https://music.youtube.com/",
};
