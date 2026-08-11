import { useEffect, useMemo, useState } from "react";
import { HtmlAudioEngine, type PlayerState } from "@/services/musicEngine";
import { bethakPlaylist } from "@/data/playlist";


function fmt(s: number) {
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

export function MusicPlayer() {
  const engine = useMemo(() => new HtmlAudioEngine(bethakPlaylist), []);
  const [state, setState] = useState<PlayerState>(() => engine.getState());

  useEffect(() => {
    const unsub = engine.subscribe(setState);
    return () => {
      unsub();
      engine.dispose();
    };
  }, [engine]);

  const pct = state.duration ? (state.position / state.duration) * 100 : 0;


  return (
    <div className="player-shell">
      <div className="player" role="group" aria-label="Bethak music player">
        <div className="artwork">
          <img
            src={state.track.artwork}
            alt={`Artwork for ${state.track.title}`}
            className="h-full w-full object-cover"
            width={512}
            height={512}
            loading="lazy"
          />
        </div>

        <div key={state.index} className="track-meta">
          <p className="track-title">{state.track.title}</p>
          <p className="track-artist">{state.track.artist}</p>
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-label="Track progress"
          >
            <span style={{ width: `${pct}%` }} />
          </div>

          <div className="player-row">
            <span className="track-times">
              {fmt(state.position)} / {fmt(state.duration)}
            </span>
            <div className="controls">
              <button type="button" className="ctl" aria-label="Previous track" onClick={() => provider.previous()}>
                <PrevIcon />
              </button>
              <button
                type="button"
                className="ctl ctl-main"
                aria-label={state.isPlaying ? "Pause" : "Play"}
                onClick={() => (state.isPlaying ? provider.pause() : provider.play())}
              >
                {state.isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button type="button" className="ctl" aria-label="Next track" onClick={() => provider.next()}>
                <NextIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

