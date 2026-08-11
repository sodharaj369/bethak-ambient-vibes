import { createFileRoute } from "@tanstack/react-router";
import { BethakBackground } from "@/components/BethakBackground";
import { BethakTitle } from "@/components/BethakTitle";
import { TopBar } from "@/components/TopBar";
import { MusicPlayer } from "@/components/MusicPlayer";
import { EXTERNAL_LINKS } from "@/data/playlist";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "बैठक — BETHAK · a late-night ghazal room" },
      {
        name: "description",
        content:
          "A quiet digital baithak. Chai, a harmonium and old Hindi ghazals in a warm, moonlit Indian sitting room.",
      },
      { property: "og:title", content: "बैठक — BETHAK" },
      {
        property: "og:description",
        content: "Sit, sip chai and listen to ghazals in a quiet late-night Indian sitting room.",
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
