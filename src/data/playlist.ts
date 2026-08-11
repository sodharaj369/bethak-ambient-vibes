export type Track = {
  title: string;
  artist: string;
  artwork: string;
  duration: number; // seconds
  spotifyUrl: string;
  youtubeUrl: string;
};

// Replace artwork paths / URLs later.
export const bethakPlaylist: Track[] = [
  {
    title: "Hothon Se Chhu Lo Tum",
    artist: "Jagjit Singh",
    artwork: "",
    duration: 296,
    spotifyUrl: "",
    youtubeUrl: "",
  },
  {
    title: "Tum Ko Dekha To Yeh Khayal Aaya",
    artist: "Jagjit Singh",
    artwork: "",
    duration: 314,
    spotifyUrl: "",
    youtubeUrl: "",
  },
  {
    title: "Ranjish Hi Sahi",
    artist: "Mehdi Hassan",
    artwork: "",
    duration: 402,
    spotifyUrl: "",
    youtubeUrl: "",
  },
  {
    title: "Aaj Jaane Ki Zid Na Karo",
    artist: "Farida Khanum",
    artwork: "",
    duration: 358,
    spotifyUrl: "",
    youtubeUrl: "",
  },
];

export const EXTERNAL_LINKS = {
  spotify: "https://open.spotify.com/",
  youtubeMusic: "https://music.youtube.com/",
};
