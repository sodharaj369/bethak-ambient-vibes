import artHarmonium from "@/assets/art-harmonium.jpg";
import artMoon from "@/assets/art-moon.jpg";
import artChai from "@/assets/art-chai.jpg";

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  /** Nominal track length in seconds. Real duration comes from the audio element once loaded. */
  duration: number;
  /** Authorized, licensed audio source. Empty string = playback disabled for this track. */
  audioUrl: string;
  spotifyUrl: string;
  youtubeUrl: string;
};

/** Backwards-compatible alias. */
export type Track = MusicTrack;

const art = [artHarmonium, artMoon, artChai];

type Seed = { title: string; artist: string; duration: number };

// Sequenced like a real baithak: settle in → deepen → the 2am stretch → farewell.
const seeds: Seed[] = [
  { title: "Hothon Se Chhu Lo Tum", artist: "Jagjit Singh", duration: 296 },
  { title: "Tum Itna Jo Muskura Rahe Ho", artist: "Jagjit Singh", duration: 344 },
  { title: "Tumko Dekha To Yeh Khayal Aaya", artist: "Jagjit Singh", duration: 314 },
  { title: "Chithi Na Koi Sandes", artist: "Jagjit Singh", duration: 288 },
  { title: "Aaj Jaane Ki Zid Na Karo", artist: "Farida Khanum", duration: 358 },
  { title: "Ranjish Hi Sahi", artist: "Mehdi Hassan", duration: 402 },
  { title: "Patta Patta Boota Boota", artist: "Mehdi Hassan", duration: 431 },
  { title: "Rafta Rafta Woh Meri", artist: "Mehdi Hassan", duration: 389 },
  { title: "Baat Karni Mujhe Mushkil", artist: "Ghulam Ali", duration: 372 },
  { title: "Chupke Chupke Raat Din", artist: "Ghulam Ali", duration: 468 },
  { title: "Hungama Hai Kyon Barpa", artist: "Ghulam Ali", duration: 341 },
  { title: "Dil Cheez Kya Hai", artist: "Asha Bhosle", duration: 401 },
  { title: "In Aankhon Ki Masti Ke", artist: "Asha Bhosle", duration: 268 },
  { title: "Yeh Kya Jagah Hai Doston", artist: "Lata Mangeshkar", duration: 322 },
  { title: "Aap Ki Nazron Ne Samjha", artist: "Lata Mangeshkar", duration: 279 },
  { title: "Lag Ja Gale", artist: "Lata Mangeshkar", duration: 258 },
  { title: "Abhi Na Jao Chhod Kar", artist: "Mohammed Rafi & Asha Bhosle", duration: 302 },
  { title: "Din Dhal Jaye", artist: "Mohammed Rafi", duration: 306 },
  { title: "Jaane Woh Kaise Log The", artist: "Hemant Kumar", duration: 245 },
  { title: "Phir Wohi Raat Hai", artist: "Kishore Kumar", duration: 267 },
  { title: "Zindagi Ke Safar Mein", artist: "Kishore Kumar", duration: 314 },
  { title: "Aankhon Mein Humne", artist: "Kishore Kumar", duration: 288 },
  { title: "Woh Kagaz Ki Kashti", artist: "Jagjit Singh", duration: 401 },
  { title: "Kabhi Kisi Ko Mukammal", artist: "Bhupinder Singh", duration: 296 },
  { title: "Dil Dhoondta Hai", artist: "Bhupinder Singh & Lata Mangeshkar", duration: 315 },
  { title: "Ae Dil-e-Nadan", artist: "Lata Mangeshkar", duration: 361 },
  { title: "Naam Gum Jayega", artist: "Bhupinder Singh & Lata Mangeshkar", duration: 334 },
  { title: "Ab Ke Hum Bichhde", artist: "Mehdi Hassan", duration: 424 },
];

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const bethakPlaylist: MusicTrack[] = seeds.map((s, i) => ({
  id: `${i + 1}-${slug(s.title)}`,
  ...s,
  artwork: art[i % art.length] as string,
  // No authorized audio source configured yet — playback stays disabled.
  audioUrl: "",
  spotifyUrl: "",
  youtubeUrl: "",
}));

export const EXTERNAL_LINKS = {
  spotify: "https://open.spotify.com/",
  youtubeMusic: "https://music.youtube.com/",
};
