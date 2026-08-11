import artHarmonium from "@/assets/art-harmonium.jpg";
import artMoon from "@/assets/art-moon.jpg";
import artChai from "@/assets/art-chai.jpg";

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  /** YouTube video ID — the real playback source. */
  youtubeId: string;
  /** Canonical watch URL, for attribution / external links. */
  youtubeUrl: string;
};

/** Backwards-compatible alias. */
export type Track = MusicTrack;

const art = [artHarmonium, artMoon, artChai];

/**
 * Add tracks here — one line each. Everything else (id, url, artwork) is derived.
 * Scales to 20–30 tracks without touching any other file.
 */
type Seed = { title: string; artist: string; youtubeId: string };

const seeds: Seed[] = [
  { title: "Hothon Se Chhu Lo Tum", artist: "Jagjit Singh", youtubeId: "X0gB9jcgXxg" },
  { title: "Tum Ko Dekha To Yeh Khayal Aaya", artist: "Jagjit Singh", youtubeId: "WtPbNKk9XpU" },
  { title: "Jhuki Jhuki Si Nazar", artist: "Jagjit Singh", youtubeId: "xY2P6IAd0MI" },
];

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const bethakPlaylist: MusicTrack[] = seeds.map((s, i) => ({
  id: `${i + 1}-${slug(s.title)}`,
  title: s.title,
  artist: s.artist,
  youtubeId: s.youtubeId,
  youtubeUrl: `https://www.youtube.com/watch?v=${s.youtubeId}`,
  artwork: art[i % art.length] as string,
}));

export const EXTERNAL_LINKS = {
  spotify: "https://open.spotify.com/",
  youtubeMusic: "https://music.youtube.com/",
};
