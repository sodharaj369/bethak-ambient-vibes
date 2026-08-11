import { useEffect } from "react";
import type { MusicTrack } from "@/data/playlist";

function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M16 4l4.5 3.5L16 11V8.6h-1.6l-2 2.6-1.3-1.7L13.4 6.6H16V4zM3.5 6.6h4l6.9 8.8H16V13l4.5 3.5L16 20v-2.4h-2.6L6.5 8.8h-3v-2.2zM3.5 15.4h3l1.9-2.4 1.3 1.7-2.4 3H3.5v-2.3z" />
    </svg>
  );
}
function RepeatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M7 5.6h9V3l4.5 3.6L16 10.2V7.6H7.6v2.6L4 7.6l3-2zM17 18.4H8V21l-4.5-3.6L8 13.8v2.6h8.4v-2.6l3.6 3.6-3 1z" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z" />
    </svg>
  );
}

type Props = {
  tracks: MusicTrack[];
  currentIndex: number;
  shuffle: boolean;
  repeat: boolean;
  onSelect: (index: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onClose: () => void;
};

export function PlaylistPanel({
  tracks,
  currentIndex,
  shuffle,
  repeat,
  onSelect,
  onToggleShuffle,
  onToggleRepeat,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="panel-overlay" onPointerDown={onClose}>
      <div
        className="playlist-panel"
        role="dialog"
        aria-label="बैठक की ग़ज़लें"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="panel-head">
          <p className="panel-title">बैठक की ग़ज़लें · {tracks.length}</p>
          <button type="button" className="ctl" aria-label="Close playlist" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="panel-modes">
          <button
            type="button"
            className={`mode-btn${shuffle ? " mode-on" : ""}`}
            aria-label="Shuffle"
            aria-pressed={shuffle}
            onClick={onToggleShuffle}
          >
            <ShuffleIcon />
            <span>Shuffle</span>
          </button>
          <button
            type="button"
            className={`mode-btn${repeat ? " mode-on" : ""}`}
            aria-label="Repeat playlist"
            aria-pressed={repeat}
            onClick={onToggleRepeat}
          >
            <RepeatIcon />
            <span>Repeat</span>
          </button>
        </div>

        <ul className="panel-list">
          {tracks.map((t, i) => (
            <li key={t.id}>
              <button
                type="button"
                className={`panel-item${i === currentIndex ? " panel-item-active" : ""}`}
                aria-current={i === currentIndex}
                onClick={() => onSelect(i)}
              >
                <span className="panel-note" aria-hidden="true">
                  ♫
                </span>
                <span className="panel-text">
                  <span className="panel-song">{t.title}</span>
                  <span className="panel-artist">{t.artist}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
