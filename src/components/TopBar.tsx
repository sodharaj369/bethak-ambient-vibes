export function TopBar({
  spotifyUrl,
  youtubeUrl,
}: {
  spotifyUrl: string;
  youtubeUrl: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-end p-4 md:p-6">
      <span className="pointer-events-auto flex items-center gap-4">
        <a className="text-ui text-glow link-quiet" href={spotifyUrl} target="_blank" rel="noreferrer">
          Spotify
        </a>
        <a className="text-ui text-glow link-quiet" href={youtubeUrl} target="_blank" rel="noreferrer">
          YouTube
        </a>
      </span>
    </div>
  );
}
