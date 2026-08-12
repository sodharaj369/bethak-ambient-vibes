/**
 * BETHAK SESSIONS — one curated sitting per mood.
 *
 * A session ties together everything that makes a mood: the video scene, the
 * ambient room sound and the songs that belong in that room. Adding a new
 * bethak later means adding one object here — nothing in the UI is hardcoded.
 *
 * songs: ids from src/data/bethakPlaylist.ts, in listening order.
 *        Leave the array empty to fall back to the full playlist.
 * ambience: file base name inside public/ambience/ (see AMBIENCE_FORMATS).
 */
import { bethakPlaylist, type MusicTrack } from "@/data/playlist";
import { DEFAULT_MOOD, SCENES, type MoodId } from "@/data/scenes";

export type BethakSessionConfig = {
  id: MoodId;
  /** Devanagari word shown in the mood selector (mirrors the scene label). */
  name: string;
  /** Full name, e.g. "Baarish Ki Bethak". */
  title: string;
  description: string;
  /** Ambience file base name in public/ambience/, or null for silence. */
  ambience: string | null;
  /** Ambience loudness relative to the global ambience volume (0–1). */
  ambienceGain: number;
  songs: string[];
};

export const BETHAK_SESSIONS: BethakSessionConfig[] = [
  {
    id: "raat",
    name: "रात",
    title: "Raat Ki Bethak",
    description: "Late night, a slow fan, and ghazals that stay till morning.",
    ambience: "raat",
    ambienceGain: 1.0,
    songs: [
      "song-1", "song-2", "song-11", "song-12", "song-18", "song-19",
      "song-5", "song-20", "song-13", "song-6", "song-16",
    ],
  },
  {
    id: "baarish",
    name: "बारिश",
    title: "Baarish Ki Bethak",
    description: "Rain outside the window, chai inside, nothing to hurry for.",
    ambience: "baarish",
    ambienceGain: 1.0,
    songs: [
      "song-3", "song-4", "song-9", "song-14", "song-15", "song-21",
      "song-1", "song-12", "song-13", "song-6",
    ],
  },
  {
    id: "shaam",
    name: "शाम",
    title: "Shaam Ki Bethak",
    description: "The last light of the day, birds settling, a soft mehfil.",
    ambience: "shaam",
    ambienceGain: 0.95,
    songs: [
      "song-20", "song-5", "song-17", "song-7", "song-16", "song-13",
      "song-2", "song-11", "song-6",
    ],
  },
  {
    id: "yaadein",
    name: "यादें",
    title: "Yaadon Ki Bethak",
    description: "Old letters, older songs, and a room full of remembering.",
    ambience: "yaadein",
    ambienceGain: 0.9,
    songs: [
      "song-10", "song-8", "song-22", "song-23", "song-24", "song-25",
      "song-26", "song-18", "song-19", "song-12",
    ],
  },
];

export const sessionFor = (mood: MoodId): BethakSessionConfig =>
  BETHAK_SESSIONS.find((s) => s.id === mood) ??
  BETHAK_SESSIONS.find((s) => s.id === DEFAULT_MOOD) ??
  BETHAK_SESSIONS[0]!;

/** The songs of a sitting, resolved against the real playlist. */
export function sessionTracks(mood: MoodId): MusicTrack[] {
  const wanted = sessionFor(mood).songs;
  const tracks = wanted
    .map((id) => bethakPlaylist.find((t) => t.id === id))
    .filter((t): t is MusicTrack => !!t);
  return tracks.length > 0 ? tracks : bethakPlaylist;
}

export const isMoodId = (v: unknown): v is MoodId =>
  typeof v === "string" && SCENES.some((s) => s.id === v);
