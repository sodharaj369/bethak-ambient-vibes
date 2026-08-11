import { createFileRoute } from "@tanstack/react-router";
import { BethakBackground } from "@/components/BethakBackground";
import { BethakTitle } from "@/components/BethakTitle";
import { TopBar } from "@/components/TopBar";
import { MusicPlayer } from "@/components/MusicPlayer";
import { EXTERNAL_LINKS } from "@/data/playlist";

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


function Index() {
  return (
    <main className="bethak-screen">
      <BethakBackground />
      <TopBar spotifyUrl={EXTERNAL_LINKS.spotify} youtubeUrl={EXTERNAL_LINKS.youtubeMusic} />

      <div className="title-slot">
        <BethakTitle />
      </div>

      <MusicPlayer />
    </main>
  );
}
