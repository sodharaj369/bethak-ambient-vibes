import { useEffect, useState } from "react";

function format(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

export function TopBar({
  spotifyUrl,
  youtubeUrl,
}: {
  spotifyUrl: string;
  youtubeUrl: string;
}) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const tick = () => setTime(format(new Date()));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 md:p-6">
      <span className="text-ui text-glow tabular-nums" aria-label="Local time">
        {time}
      </span>

      <span className="pointer-events-auto flex items-center gap-5">
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
