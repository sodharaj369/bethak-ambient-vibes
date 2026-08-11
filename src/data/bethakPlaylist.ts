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
    title: "Chupke Chupke Raat Din",
    artist: "Ghulam Ali",
    youtubeId: "MWjaK_nW72E",
  },
  {
    id: "song-4",
    title: "Hungama Hai Kyun Barpa",
    artist: "Ghulam Ali",
    youtubeId: "xQsMn1kmJs4",
  },
  {
    id: "song-5",
    title: "Ranjish Hi Sahi",
    artist: "Mehdi Hassan",
    youtubeId: "Xc6uwbXpmUY",
  },
  {
    id: "song-6",
    title: "Aaj Jaane Ki Zid Na Karo",
    artist: "Farida Khanum",
    youtubeId: "CfUDuYAasjE",
  },
  {
    id: "song-7",
    title: "Ahista",
    artist: "Pankaj Udhas",
    youtubeId: "wvmRswRlbfU",
  },
  {
    id: "song-8",
    title: "Chitthi Aayee Hai",
    artist: "Pankaj Udhas",
    youtubeId: "v0_IRIFYC0k",
  },
  {
    id: "song-9",
    title: "Yeh Dil Yeh Pagal Dil Mera",
    artist: "Ghulam Ali",
    youtubeId: "pZWqn3BC17Q",
  },
  {
    id: "song-10",
    title: "Woh Kaghaz Ki Kashti",
    artist: "Jagjit Singh & Chitra Singh",
    youtubeId: "xEdAiJiwkDE",
  },
  {
    id: "song-11",
    title: "Hoshwalon Ko Khabar Kya",
    artist: "Jagjit Singh",
    youtubeId: "ag3ENMEV89o",
  },
  {
    id: "song-12",
    title: "Koi Fariyaad",
    artist: "Jagjit Singh",
    youtubeId: "8MN2bxMiB9A",
  },
  {
    id: "song-13",
    title: "Phir Chhidi Raat",
    artist: "Talat Aziz & Lata Mangeshkar",
    youtubeId: "meif1oIfJ5o",
  },
  {
    id: "song-14",
    title: "Mehfil Mein Baar Baar",
    artist: "Ghulam Ali",
    youtubeId: "AfAJC8ioVus",
  },
  {
    id: "song-15",
    title: "Humko Kis Ke Gham Ne Maara",
    artist: "Ghulam Ali",
    youtubeId: "LnVW-lYaRIs",
  },
  {
    id: "song-16",
    title: "In Aankhon Ki Masti",
    artist: "Asha Bhosle",
    youtubeId: "yjYE41bYnUM",
  },
  {
    id: "song-17",
    title: "Chandi Jaisa Rang",
    artist: "Pankaj Udhas",
    youtubeId: "FKV9ieymWkE",
  },
  {
    id: "song-18",
    title: "Tum Itna Jo Muskura Rahe Ho",
    artist: "Jagjit Singh",
    youtubeId: "C8eAKT-zQXk",
  },
  {
    id: "song-19",
    title: "Koi Yeh Kaise Bataye",
    artist: "Jagjit Singh",
    youtubeId: "UyI-VIliCAM",
  },
  {
    id: "song-20",
    title: "Gulon Mein Rang Bhare",
    artist: "Mehdi Hassan",
    youtubeId: "Ds8nabK0vE8",
  },
  {
    id: "song-21",
    title: "Apni Dhun Mein Rehta Hoon",
    artist: "Ghulam Ali",
    youtubeId: "YLMo9XwY5RM",
  },
  {
    id: "song-22",
    title: "Nayan Ne Bandh Rakhi Ne",
    artist: "Manhar Udhas",
    youtubeId: "g6UiqaJO7a0",
  },
  {
    id: "song-23",
    title: "Hriday Na Dard Ni",
    artist: "Manhar Udhas",
    youtubeId: "T6JMgA_l3m4",
  },
  {
    id: "song-24",
    title: "Shant Zarukhe",
    artist: "Manhar Udhas",
    youtubeId: "L5xehAJZis4",
  },
  {
    id: "song-25",
    title: "Biji To Koi Rite",
    artist: "Manhar Udhas",
    youtubeId: "OorUG9lbAuI",
  },
  {
    id: "song-26",
    title: "Jyare Pranay Ni Jagma",
    artist: "Manhar Udhas",
    youtubeId: "DyzX_K5XBCU",
  },
];

export default bethakPlaylist;
