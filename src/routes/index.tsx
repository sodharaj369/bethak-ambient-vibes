import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BethakBackground } from "@/components/BethakBackground";
import { BethakTitle } from "@/components/BethakTitle";
import { TopBar } from "@/components/TopBar";
import { MusicPlayer } from "@/components/MusicPlayer";
import { MoodSelector } from "@/components/MoodSelector";
import { DEFAULT_MOOD, SCENES, type MoodId } from "@/data/scenes";
import { EXTERNAL_LINKS } from "@/data/playlist";
import { readSession, writeSession } from "@/lib/bethakSession";

const SITE_URL = "https://bethak-ambient-vibes.lovable.app";
const OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/203ee2ffb2df3ab500cb78974f55721e/id-preview-de424624--6701c47f-b796-4d87-b4ab-aa45a2a7709d.lovable.app-1786444994186.png";
const TITLE = "बैठक — ग़ज़लें • चाय • थोड़ी देर बैठो";
const DESCRIPTION =
  "Bethak is a quiet late-night ghazal room: press play for old Hindi ghazals by Jagjit Singh, Mehdi Hassan and Ghulam Ali in a warm, moonlit Indian sitting room.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL + "/" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "बैठक BETHAK",
          alternateName: "Bethak",
          url: SITE_URL + "/",
          description: DESCRIPTION,
          inLanguage: ["hi", "en"],
}),
      },
    ],
  }),
  component: Index,
});


const MOOD_KEY = "bethakMood";

function Index() {
  const [mood, setMood] = useState<MoodId>(DEFAULT_MOOD);
  const [entered, setEntered] = useState(false);
  const [lifting, setLifting] = useState(false);

  // Restore the last chosen mood after hydration (keeps SSR markup stable).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MOOD_KEY) ?? readSession()?.mood;
      if (saved && SCENES.some((s) => s.id === saved)) setMood(saved as MoodId);
    } catch {
      /* storage blocked — stay on the default */
    }
  }, []);

  const chooseMood = (id: MoodId) => {
    setMood(id);
    try {
      window.localStorage.setItem(MOOD_KEY, id);
      writeSession({ mood: id });
    } catch {
      /* ignore */
    }
  };

  // Step in: the room starts moving, then the warm darkness slowly lifts,
  // and only once the room is fully there does the player settle in.
  const [showPlayer, setShowPlayer] = useState(false);
  const [veilGone, setVeilGone] = useState(false);
  const enterBethak = () => {
    if (entered) return;
    setEntered(true);
    // The overlay element stays in place and only its opacity animates,
    // starting a beat after the video has begun underneath.
    // Nothing here waits on media: the reveal starts on the gesture itself.
    window.setTimeout(() => setLifting(true), 80);
    window.setTimeout(() => setShowPlayer(true), 800);
    window.setTimeout(() => setVeilGone(true), 2000);
  };

  return (
    <main className="bethak-screen">
      <BethakBackground mood={mood} started={entered} />
      <div className={`ui-reveal ${showPlayer ? "ui-reveal-on" : ""}`} aria-hidden={!showPlayer}>
        <TopBar spotifyUrl={EXTERNAL_LINKS.spotify} youtubeUrl={EXTERNAL_LINKS.youtubeMusic} />
      </div>

      <div className="title-slot">
        <BethakTitle />
      </div>

      <MoodSelector mood={mood} onChange={chooseMood} />

      {/* Mounted from the start (invisible) so the audio engine is warm and
          the player can appear instantly on entry — never a loading state. */}
      <div className={`ui-reveal ${showPlayer ? "ui-reveal-on" : ""}`} aria-hidden={!showPlayer}>
        <MusicPlayer autoStart={entered} />
      </div>

      {!veilGone && (
        <div className={`enter-veil ${lifting ? "enter-veil-out" : ""}`}>
          <button
            type="button"
            className={`enter-word font-devanagari${entered ? " enter-word-gone" : ""}`}
            onClick={enterBethak}
            aria-hidden={entered}
            tabIndex={entered ? -1 : 0}
          >
            बैठक में आइए
          </button>
        </div>
      )}
    </main>
  );
}
