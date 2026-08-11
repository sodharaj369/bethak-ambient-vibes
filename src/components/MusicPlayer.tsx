import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getYouTubeEngine, type PlayerState } from "@/services/musicEngine";
import { bethakPlaylist } from "@/data/playlist";

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M7 5h2v14H7zM20 5v14L9.5 12z" />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M15 5h2v14h-2zM4 5v14l10.5-7z" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5v15L20 12z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" />
    </svg>
  );
}
function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 opacity-50" fill="currentColor" aria-hidden="true">
      <path d="M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
    </svg>
  );
}

const YT_HOST_ID = "bethak-yt-host";

function Artwork({
  trackId,
  candidates,
  title,
}: {
  trackId: string;
  candidates: string[];
  title: string;
}) {
  const [fallback, setFallback] = useState({ trackId, index: 0 });
  const index = fallback.trackId === trackId ? fallback.index : 0;
  const src = candidates[index];
  if (!src) return <NoteIcon />;
  return (
    <img
      src={src}
      alt={`Artwork for ${title}`}
      className="h-full w-full object-cover"
      width={512}
      height={512}
      onError={() =>
        setFallback((current) => ({
          trackId,
          index: current.trackId === trackId ? current.index + 1 : 1,
        }))
      }
    />
  );
}

export function MusicPlayer() {
  const engine = useMemo(() => getYouTubeEngine(YT_HOST_ID, bethakPlaylist), []);
  const [state, setState] = useState<PlayerState>(() => engine.getState());
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const unsub = engine.subscribe(setState);
    // Only unsubscribe here: the engine owns the YouTube player for the page
    // lifetime, so a dev-mode remount must not tear the real player down.
    return unsub;
  }, [engine]);

  const pct = state.duration ? Math.min(100, (state.position / state.duration) * 100) : 0;

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const el = barRef.current;
      const duration = engine.getDuration();
      if (!el || !duration) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      engine.seek(ratio * duration);
    },
    [engine],
  );

  // Pointer events cover mouse, touch and pen — click and drag both work.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (draggingRef.current) seekFromClientX(e.clientX);
    };
    const up = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [seekFromClientX]);

  return (
    <div className="player-shell">
      {/* Official YouTube IFrame Player API host — the real playback engine. */}
      <div className="yt-host" aria-hidden="true">
        <div id={YT_HOST_ID} />
      </div>
      <div className="player" role="group" aria-label="Bethak music player">
        <div className="artwork">
          <Artwork
            trackId={state.track.id}
            candidates={state.track.artworkCandidates}
            title={state.track.title}
          />
        </div>

        <div key={state.track.id} className="track-meta">
          <p className="track-title">{state.track.title}</p>
          <p className="track-artist">{state.track.artist}</p>
          <div
            ref={barRef}
            className="progress"
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-label="Seek within track"
            onPointerDown={(e) => {
              draggingRef.current = true;
              seekFromClientX(e.clientX);
            }}
            onKeyDown={(e) => {
              const d = engine.getDuration();
              if (!d) return;
              if (e.key === "ArrowRight") engine.seek(engine.getCurrentTime() + 5);
              if (e.key === "ArrowLeft") engine.seek(engine.getCurrentTime() - 5);
            }}
          >
            <span style={{ width: `${pct}%` }} />
          </div>

          <div className="player-row">
            <span className="track-times">
              {fmt(state.position)} / {fmt(state.duration)}
            </span>
            <div className="controls">
              <button type="button" className="ctl" aria-label="Previous track" onClick={() => engine.previous()}>
                <PrevIcon />
              </button>
              <button
                type="button"
                className="ctl ctl-main"
                aria-label={state.isPlaying ? "Pause" : "Play"}
                title={state.canPlay ? undefined : "Connecting to YouTube player…"}
                aria-disabled={!state.canPlay}
                onClick={() => (state.isPlaying ? engine.pause() : void engine.play())}
              >
                {state.isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button type="button" className="ctl" aria-label="Next track" onClick={() => engine.next()}>
                <NextIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
