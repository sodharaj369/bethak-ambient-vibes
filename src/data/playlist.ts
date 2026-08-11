import rawPlaylist, { type PlaylistEntry } from "@/data/bethakPlaylist";

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

export const thumbnailCandidates = (youtubeId: string) => [
  `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
  `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
  `https://img.youtube.com/vi/${youtubeId}/default.jpg`,
];

const isNonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/**
 * Validates and normalises the editable playlist file.
 * Invalid tracks are skipped with a developer warning instead of crashing.
 */
function buildPlaylist(entries: PlaylistEntry[]): MusicTrack[] {
  const seen = new Set<string>();
  const tracks: MusicTrack[] = [];

  entries.forEach((entry, i) => {
    const where = `bethakPlaylist[${i}]`;

    if (!entry || typeof entry !== "object") {
      console.warn(`[BETHAK] ${where} is not a track object — skipped.`);
      return;
    }

    const missing = (["title", "artist", "youtubeId"] as const).filter(
      (k) => !isNonEmpty(entry[k]),
    );
    if (missing.length > 0) {
      console.warn(
        `[BETHAK] ${where} ("${entry.title ?? "untitled"}") is missing: ${missing.join(", ")} — skipped.`,
      );
      return;
    }

    let id = isNonEmpty(entry.id) ? entry.id.trim() : `track-${i + 1}`;
    if (!isNonEmpty(entry.id)) {
      console.warn(`[BETHAK] ${where} has no id — using "${id}".`);
    }
    if (seen.has(id)) {
      const unique = `${id}-${i + 1}`;
      console.warn(`[BETHAK] ${where} has duplicate id "${id}" — using "${unique}" instead.`);
      id = unique;
    }
    seen.add(id);

    const youtubeId = entry.youtubeId.trim();
    tracks.push({
      id,
      title: entry.title.trim(),
      artist: entry.artist.trim(),
      youtubeId,
      youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      artworkCandidates: thumbnailCandidates(youtubeId),
    });
  });

  if (tracks.length === 0) {
    console.warn("[BETHAK] No valid tracks found in src/data/bethakPlaylist.ts.");
  }

  return tracks;
}

export const bethakPlaylist: MusicTrack[] = buildPlaylist(rawPlaylist);

export const EXTERNAL_LINKS = {
  spotify: "https://open.spotify.com/",
  youtubeMusic: "https://music.youtube.com/",
};
