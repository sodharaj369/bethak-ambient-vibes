/**
 * BETHAK PLAYLIST — the single source of truth.
 *
 * HOW TO EDIT:
 *  - ADD a song:     add an object anywhere in the list below.
 *  - REMOVE a song:  delete its object.
 *  - REORDER:        move objects up/down — playback order follows this order.
 *
 * Each song needs exactly four fields:
 *   id        unique string (any value, just don't repeat one)
 *   title     song name shown in the player
 *   artist    artist name shown in the player
 *   youtubeId the part after "v=" in a YouTube URL
 *             e.g. https://www.youtube.com/watch?v=X0gB9jcgXxg  ->  "X0gB9jcgXxg"
 *
 * Artwork is generated automatically from youtubeId. Do not add an artwork field.
 * Nothing else in the app needs to change when you edit this file.
 */

export type PlaylistEntry = {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
};

const bethakPlaylist: PlaylistEntry[] = [
  {
    id: "song-1",
    title: "Hothon Se Chhu Lo Tum",
    artist: "Jagjit Singh",
    youtubeId: "X0gB9jcgXxg",
  },
  {
    id: "song-2",
    title: "Tum Ko Dekha To Yeh Khayal Aaya",
    artist: "Jagjit Singh",
    youtubeId: "WtPbNKk9XpU",
  },
  {
    id: "song-3",
    title: "Jhuki Jhuki Si Nazar",
    artist: "Jagjit Singh",
    youtubeId: "xY2P6IAd0MI",
  },
];

export default bethakPlaylist;
